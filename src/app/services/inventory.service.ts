import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, catchError, of, shareReplay, firstValueFrom } from 'rxjs';
import { Producto, CotizacionBorrador } from '../models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private supabase: SupabaseClient;
    private auth = inject(AuthService);
    private productosCache$?: Observable<Producto[]>;

    constructor() {
        this.supabase = inject(SupabaseService).getClient();
    }

    /**
     * Obtiene los productos del proveedor logueado con caché y selects específicos
     */
    getProductos(forceRefresh = false): Observable<Producto[]> {
        const userId = this.auth.getUserId();
        if (!userId) return of([]);

        if (!this.productosCache$ || forceRefresh) {
            this.productosCache$ = from(this.supabase
                .from('productos')
                .select('id, nombre, descripcion, precio_unitario, stock, imagen_url, categoria, creado_en')
                .eq('proveedor_id', userId)
                .order('creado_en', { ascending: false })
            ).pipe(
                map(({ data, error }) => {
                    if (error) throw error;
                    return (data || []) as any as Producto[];
                }),
                catchError(error => {
                    console.error('Error fetching inventory:', error);
                    return of([]);
                }),
                shareReplay(1)
            );
        }
        return this.productosCache$;
    }

    /**
     * Crea un nuevo producto
     */
    createProducto(producto: Partial<Producto>): Observable<Producto | null> {
        const userId = this.auth.getUserId();
        if (!userId) return of(null);

        const payload = {
            ...producto,
            proveedor_id: userId
        };

        return from(this.supabase
            .from('productos')
            .insert(payload)
            .select()
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as Producto;
            }),
            catchError(error => {
                console.error('Error creating product:', error);
                return of(null);
            })
        );
    }

    /**
     * Actualiza un producto existente
     */
    updateProducto(id: string, data: Partial<Producto>): Observable<Producto | null> {
        return from(this.supabase
            .from('productos')
            .update({
                ...data,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as Producto;
            }),
            catchError(error => {
                console.error('Error updating product:', error);
                return of(null);
            })
        );
    }

    /**
     * Elimina un producto
     */
    deleteProducto(id: string): Observable<boolean> {
        return from(this.supabase
            .from('productos')
            .delete()
            .eq('id', id)
        ).pipe(
            map(({ error }) => {
                if (error) throw error;
                return true;
            }),
            catchError(error => {
                console.error('Error deleting product:', error);
                return of(false);
            })
        );
    }

    /**
     * Sube una imagen de producto a Supabase Storage
     */
    async uploadProductImage(file: File): Promise<string | null> {
        const userId = this.auth.getUserId();
        if (!userId) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('inventario')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return null;
        }

        const { data } = this.supabase.storage
            .from('inventario')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    /**
     * Reduce el stock de los productos asociados a una solicitud (paquete + extras)
     */
    async reducirStockPorSolicitud(solicitudId: string): Promise<void> {
        try {
            // 1. Obtener la solicitud con su borrador de cotización
            const { data: sol, error: solError } = await this.supabase
                .from('solicitudes')
                .select('cotizacion_borrador, items_solicitud(paquete_id)')
                .eq('id', solicitudId)
                .single();

            if (solError || !sol) throw new Error('No se pudo encontrar la solicitud');
            
            const borrador = sol.cotizacion_borrador as CotizacionBorrador;
            const itemsToReduce: { id: string, cantidad: number }[] = [];

            // 2. Procesar productos extra de la cotización
            if (borrador && borrador.productos_extra) {
                borrador.productos_extra.forEach(p => {
                    if (p.producto_id) {
                        itemsToReduce.push({ id: p.producto_id, cantidad: p.cantidad });
                    }
                });
            }

            // 3. Procesar items del paquete base
            const itemsSol = sol.items_solicitud as any[];
            if (itemsSol && itemsSol.length > 0) {
                for (const item of itemsSol) {
                    if (item.paquete_id) {
                        const { data: pkgItems, error: pkgItemsError } = await this.supabase
                            .from('items_paquete')
                            .select('producto_id, cantidad')
                            .eq('paquete_id', item.paquete_id);
                        
                        if (!pkgItemsError && pkgItems) {
                            pkgItems.forEach(pi => {
                                if (pi.producto_id) {
                                    // Multiplicar por la cantidad de paquetes solicitados
                                    const cantTotal = pi.cantidad * (borrador?.paquete_base?.cantidad || 1);
                                    itemsToReduce.push({ id: pi.producto_id, cantidad: cantTotal });
                                }
                            });
                        }
                    }
                }
            }

            // 4. Ejecutar la reducción de cada producto
            if (itemsToReduce.length > 0) {
                console.log('📉 Reduciendo stock para items:', itemsToReduce);
                for (const item of itemsToReduce) {
                    // Usamos una operación atómica: stock = stock - cantidad
                    const { error: updateError } = await this.supabase.rpc('increment_stock', {
                        row_id: item.id,
                        amount: -item.cantidad
                    });

                    if (updateError) {
                        // Si falla el RPC (que es lo ideal para evitar race conditions), probamos update normal
                        console.warn('⚠️ RPC increment_stock falló, usando update tradicional:', updateError);
                        
                        const { data: currentProd } = await this.supabase
                            .from('productos')
                            .select('stock')
                            .eq('id', item.id)
                            .single();
                        
                        if (currentProd) {
                            await this.supabase
                                .from('productos')
                                .update({ stock: Math.max(0, currentProd.stock - item.cantidad) })
                                .eq('id', item.id);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error en reducirStockPorSolicitud:', error);
            throw error;
        }
    }
}

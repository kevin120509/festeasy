import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, catchError, of } from 'rxjs';
import { Producto } from '../models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private supabase: SupabaseClient;
    private auth = inject(AuthService);

    constructor() {
        this.supabase = inject(SupabaseService).getClient();
    }

    /**
     * Obtiene los productos del proveedor logueado
     */
    getProductos(): Observable<Producto[]> {
        const userId = this.auth.getUserId();
        if (!userId) return of([]);

        return from(this.supabase
            .from('productos')
            .select('*')
            .eq('proveedor_id', userId)
            .order('creado_en', { ascending: false })
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return (data || []) as Producto[];
            }),
            catchError(error => {
                console.error('Error fetching inventory:', error);
                return of([]);
            })
        );
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
}

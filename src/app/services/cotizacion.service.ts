import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
    CotizacionBorrador,
    DesglosePaqueteBase,
    DesgloseProducto,
    DesgloseAjuste,
    Producto
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private supabase = inject(SupabaseService);

    /**
     * Obtiene el borrador de cotización de una solicitud
     */
    async getBorrador(solicitudId: string): Promise<CotizacionBorrador | null> {
        const { data, error } = await this.supabase.getClient()
            .from('solicitudes')
            .select('cotizacion_borrador')
            .eq('id', solicitudId)
            .single();

        if (error) throw error;
        return data?.cotizacion_borrador || null;
    }

    /**
     * Guarda el borrador de cotización sin cambiar el estado
     */
    async guardarBorrador(solicitudId: string, borrador: CotizacionBorrador): Promise<void> {
        const { error } = await this.supabase.getClient()
            .from('solicitudes')
            .update({
                cotizacion_borrador: borrador,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', solicitudId);

        if (error) throw error;
    }

    /**
     * Envía la cotización al cliente:
     * - Guarda el borrador
     * - Actualiza montos en la solicitud
     * - Cambia estado a 'esperando_confirmacion_cliente'
     */
    async enviarCotizacion(solicitudId: string, borrador: CotizacionBorrador): Promise<void> {
        const { error } = await this.supabase.getClient()
            .from('solicitudes')
            .update({
                cotizacion_borrador: borrador,
                monto_total: borrador.monto_total,
                monto_anticipo: borrador.monto_anticipo,
                monto_liquidacion: borrador.monto_liquidacion,
                estado: 'esperando_confirmacion_cliente',
                actualizado_en: new Date().toISOString()
            })
            .eq('id', solicitudId);

        if (error) throw error;
    }

    /**
     * Inicia la negociación en una solicitud
     */
    async iniciarNegociacion(solicitudId: string): Promise<void> {
        const { error } = await this.supabase.getClient()
            .from('solicitudes')
            .update({
                estado: 'en_negociacion',
                actualizado_en: new Date().toISOString()
            })
            .eq('id', solicitudId);

        if (error) throw error;
    }

    /**
     * El cliente acepta la cotización → pasa a esperando_anticipo
     */
    async aceptarCotizacion(solicitudId: string): Promise<void> {
        const { error } = await this.supabase.getClient()
            .from('solicitudes')
            .update({
                estado: 'esperando_anticipo',
                actualizado_en: new Date().toISOString()
            })
            .eq('id', solicitudId);

        if (error) throw error;
    }

    /**
     * Obtiene productos del inventario del proveedor (para el buscador)
     */
    async getProductosProveedor(proveedorId: string): Promise<Producto[]> {
        const { data, error } = await this.supabase.getClient()
            .from('productos')
            .select('*')
            .eq('proveedor_id', proveedorId)
            .order('nombre');

        if (error) throw error;
        return data || [];
    }

    /**
     * Busca productos del proveedor por nombre
     */
    async buscarProductos(proveedorId: string, query: string): Promise<Producto[]> {
        const { data, error } = await this.supabase.getClient()
            .from('productos')
            .select('*')
            .eq('proveedor_id', proveedorId)
            .ilike('nombre', `%${query}%`)
            .order('nombre')
            .limit(20);

        if (error) throw error;
        return data || [];
    }

    /**
     * Calcula todos los totales de un borrador
     */
    calcularTotales(
        paqueteBase: DesglosePaqueteBase,
        productosExtra: DesgloseProducto[],
        ajustes: DesgloseAjuste[],
        anticipoTipo: 'porcentaje' | 'monto_fijo',
        anticipoValor: number
    ): Pick<CotizacionBorrador, 'subtotal' | 'descuento_total' | 'monto_total' | 'monto_anticipo' | 'monto_liquidacion'> {

        // Subtotal del paquete base (precio + variantes extras)
        let subtotalPaquete = paqueteBase.precio_base * paqueteBase.cantidad;
        if (paqueteBase.variantes_seleccionadas) {
            subtotalPaquete += paqueteBase.variantes_seleccionadas.reduce(
                (sum, v) => sum + v.precio_extra, 0
            ) * paqueteBase.cantidad;
        }

        // Subtotal de productos extra
        const subtotalProductos = productosExtra.reduce((sum, p) => sum + p.subtotal, 0);

        // Subtotal antes de ajustes
        const subtotalBruto = subtotalPaquete + subtotalProductos;

        // Aplicar ajustes
        const cargos = ajustes
            .filter(a => a.tipo === 'cargo')
            .reduce((sum, a) => sum + a.monto, 0);

        const descuentos = ajustes
            .filter(a => a.tipo === 'descuento')
            .reduce((sum, a) => sum + a.monto, 0);

        const subtotal = subtotalBruto + cargos;
        const monto_total = subtotal - descuentos;

        // Calcular anticipo
        const monto_anticipo = anticipoTipo === 'porcentaje'
            ? Math.round((monto_total * anticipoValor / 100) * 100) / 100
            : anticipoValor;

        const monto_liquidacion = Math.round((monto_total - monto_anticipo) * 100) / 100;

        return {
            subtotal,
            descuento_total: descuentos,
            monto_total,
            monto_anticipo,
            monto_liquidacion
        };
    }

    /**
     * Crea un borrador inicial a partir de los items de la solicitud
     */
    crearBorradorInicial(
        paqueteNombre: string,
        paqueteId: string,
        precioBase: number,
        cantidad: number,
        porcentajeAnticipo: number = 30
    ): CotizacionBorrador {
        const paqueteBase: DesglosePaqueteBase = {
            paquete_id: paqueteId,
            nombre: paqueteNombre,
            precio_base: precioBase,
            cantidad
        };

        const totales = this.calcularTotales(
            paqueteBase, [], [], 'porcentaje', porcentajeAnticipo
        );

        return {
            paquete_base: paqueteBase,
            productos_extra: [],
            ajustes_proveedor: [],
            ...totales,
            anticipo_tipo: 'porcentaje',
            anticipo_valor: porcentajeAnticipo
        };
    }
}

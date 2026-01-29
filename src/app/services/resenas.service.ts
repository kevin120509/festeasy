import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class ResenasService {
    private supabaseService = inject(SupabaseService);
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = this.supabaseService.getClient();
    }

    /**
     * Obtiene todas las solicitudes finalizadas de un evento para que el cliente pueda calificarlas
     */
    getSolicitudesAFinalizar(eventoId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select(`
        id,
        servicio:paquetes_proveedor(nombre_paquete),
        proveedor:perfil_proveedor(nombre_negocio, avatar_url, usuario_id),
        estado,
        evento_id
      `)
            .eq('evento_id', eventoId)
            .eq('estado', 'finalizado')
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data || [];
            })
        );
    }

    /**
     * Obtiene el detalle de una solicitud específica para calificar
     */
    getSolicitudParaReview(solicitudId: string): Observable<any> {
        return from(this.supabase
            .from('solicitudes')
            .select(`
        id,
        servicio:paquetes_proveedor(nombre_paquete),
        proveedor:perfil_proveedor(nombre_negocio, avatar_url, usuario_id),
        estado
      `)
            .eq('id', solicitudId)
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            })
        );
    }

    /**
     * Envía una reseña a la base de datos
     */
    async enviarResena(resena: {
        usuario_cliente_id: string;
        usuario_proveedor_id: string;
        solicitud_id: string;
        puntuacion: number;
        comentario: string;
    }) {
        const { data, error } = await this.supabase
            .from('resenas')
            .insert([resena])
            .select()
            .single();

        if (error) throw error;

        // Opcional: Actualizar la solicitud para marcar que ya fue calificada
        // await this.supabase.from('solicitudes').update({ calificada: true }).eq('id', resena.solicitud_id);

        return data;
    }
}

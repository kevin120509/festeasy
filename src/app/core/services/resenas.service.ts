import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap, forkJoin, of, catchError } from 'rxjs';
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
     * Obtiene todas las solicitudes finalizadas de un cliente que aún no han sido calificadas
     */
    getSolicitudesPendientesDeCalificacion(clienteId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select(`
                id,
                proveedor_usuario_id,
                estado,
                titulo_evento,
                fecha_servicio
            `)
            .eq('cliente_usuario_id', clienteId)
            .eq('estado', 'finalizado')
        ).pipe(
            switchMap(({ data: solicitudes, error }) => {
                if (error || !solicitudes || solicitudes.length === 0) return of([]);

                // 1. Obtener todas las reseñas ya hechas por este cliente
                return from(this.supabase
                    .from('resenas')
                    .select('solicitud_id')
                    .eq('cliente_id', clienteId)
                ).pipe(
                    switchMap(({ data: resenasExistentes }) => {
                        const idsCalificados = new Set((resenasExistentes || []).map(r => r.solicitud_id));

                        // 2. Filtrar solo las que NO tienen reseña
                        const pendientes = solicitudes.filter(sol => !idsCalificados.has(sol.id));

                        if (pendientes.length === 0) return of([]);

                        // 3. Enriquecer con datos del proveedor
                        const requests = pendientes.map(sol =>
                            from(this.supabase
                                .from('perfil_proveedor')
                                .select('nombre_negocio, avatar_url, usuario_id')
                                .eq('usuario_id', sol.proveedor_usuario_id)
                                .maybeSingle()
                            ).pipe(
                                map(({ data: provider }) => ({
                                    ...sol,
                                    proveedor: provider
                                })),
                                catchError(() => of(sol))
                            )
                        );
                        return forkJoin(requests);
                    })
                );
            })
        );
    }

    /**
     * Legacy method: Redirigir a la nueva lógica basada en cliente
     */
    getSolicitudesAFinalizar(clienteId: string): Observable<any[]> {
        return this.getSolicitudesPendientesDeCalificacion(clienteId);
    }

    /**
     * Obtiene el detalle de una solicitud específica para calificar
     */
    getSolicitudParaReview(solicitudId: string): Observable<any> {
        return from(this.supabase
            .from('solicitudes')
            .select('id, proveedor_usuario_id, estado, titulo_evento, fecha_servicio')
            .eq('id', solicitudId)
            .single()
        ).pipe(
            switchMap(({ data: request, error }) => {
                if (error) {
                    console.error('Error loading request for review:', error);
                    throw error;
                }
                if (!request) return of(null);

                return from(this.supabase
                    .from('perfil_proveedor')
                    .select('nombre_negocio, avatar_url, usuario_id')
                    .eq('usuario_id', request.proveedor_usuario_id)
                    .maybeSingle()
                ).pipe(
                    map(({ data: provider, error: pError }) => {
                        if (pError) console.error('Error loading provider for review:', pError);
                        return {
                            ...request,
                            proveedor: provider
                        };
                    })
                );
            })
        );
    }

    /**
     * Verifica si ya existe una reseña para una solicitud
     */
    getReviewBySolicitud(solicitudId: string): Observable<any | null> {
        return from(this.supabase
            .from('resenas')
            .select('*')
            .eq('solicitud_id', solicitudId)
            .maybeSingle()
        ).pipe(
            map(({ data, error }) => {
                if (error) {
                    console.error('Error checking for existing review:', error);
                    return null;
                }
                return data;
            })
        );
    }

    /**
     * Envía una reseña a la base de datos
     */
    async enviarResena(resena: {
        cliente_id: string;
        destinatario_id: string;
        solicitud_id: string;
        calificacion: number;
        comentario: string;
        autor_id?: string;
    }) {
        const payload = {
            ...resena,
            autor_id: resena.autor_id || resena.cliente_id // Sync redundant field
        };

        console.log('🚀 ResenasService: Enviando reseña...', payload);

        const { data, error } = await this.supabase
            .from('resenas')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('❌ ResenasService: Error al enviar reseña:', error);
            throw error;
        }

        console.log('✅ ResenasService: Reseña guardada con éxito:', data);
        return data;
    }

    /**
     * Obtiene todas las reseñas recibidas por un proveedor
     */
    getResenasPorProveedor(providerUserId: string): Observable<any[]> {
        console.log('📬 ResenasService: Buscando reseñas para:', providerUserId);

        return from(this.supabase
            .from('resenas')
            .select('*')
            .eq('destinatario_id', providerUserId)
            .order('fecha_creacion', { ascending: false })
        ).pipe(
            switchMap(({ data: resenas, error }) => {
                if (error) {
                    console.error('❌ Error al obtener reseñas base:', error);
                    return of([]);
                }

                if (!resenas || resenas.length === 0) {
                    console.log('📬 ResenasService: No se encontraron reseñas en DB.');
                    return of([]);
                }

                console.log(`📬 ResenasService: ${resenas.length} reseñas encontradas. Enriqueciendo perfiles...`);

                // Enriquecer cada reseña con el perfil del cliente manualmente (evita errores de FK/Join)
                const enrichmentRequests = resenas.map(resena =>
                    from(this.supabase
                        .from('perfil_cliente')
                        .select('nombre_completo, avatar_url')
                        .eq('usuario_id', resena.cliente_id)
                        .maybeSingle()
                    ).pipe(
                        map(({ data: profile }) => ({
                            ...resena,
                            perfil_cliente: profile || { nombre_completo: 'Cliente FestEasy' }
                        })),
                        catchError(() => of({ ...resena, perfil_cliente: { nombre_completo: 'Cliente FestEasy' } }))
                    )
                );

                return forkJoin(enrichmentRequests);
            })
        );
    }

    /**
     * Calcula estadísticas de reseñas para un proveedor
     */
    getStatsProveedor(providerUserId: string): Observable<{ promedio: number; total: number }> {
        console.log('📊 ResenasService: Calculando stats para:', providerUserId);

        return from(this.supabase
            .from('resenas')
            .select('calificacion')
            .eq('destinatario_id', providerUserId)
        ).pipe(
            map(({ data, error }) => {
                if (error) {
                    console.error('❌ ResenasService: Error en stats:', error);
                    return { promedio: 0, total: 0 };
                }

                if (!data || data.length === 0) {
                    console.log('📊 ResenasService: No hay calificaciones para calcular.');
                    return { promedio: 0, total: 0 };
                }

                const total = data.length;
                const suma = data.reduce((acc, curr) => acc + (curr.calificacion || 0), 0);
                const promedio = parseFloat((suma / total).toFixed(1));

                console.log(`📊 ResenasService: Stats calculadas: ${promedio} (${total} reseñas)`);
                return { promedio, total };
            })
        );
    }
}

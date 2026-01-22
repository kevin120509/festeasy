import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, forkJoin, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SupabaseDataService {
    private supabaseService = inject(SupabaseService);
    public supabase: SupabaseClient;

    constructor() {
        this.supabase = this.supabaseService.getClient();
    }

    // ==========================================
    // Proveedores (Marketplace)
    // ==========================================
    getProviders(): Observable<any[]> {
        // En un escenario real, harías join con perfiles
        // Por ahora simulamos obteniendo perfiles de proveedor
        return from(this.supabase
            .from('perfil_proveedor')
            .select('*')
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data || [];
            })
        );
    }

    getProviderById(id: string): Observable<any> {
        return from(this.supabase
            .from('perfil_proveedor')
            .select('*')
            .eq('id', id)
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            })
        );
    }

    getProviderPackages(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('paquetes_proveedor')
            .select('*')
            .eq('proveedor_usuario_id', providerId)
        ).pipe(
            map(({ data, error }) => {
                // Si la tabla no existe aún, retornamos vacío para no romper
                if (error && error.code === '42P01') {
                    return [];
                }
                if (error) throw error;
                return data || [];
            })
        );
    }

    getAllPackages(): Observable<any[]> {
        // Para el marketplace general, si quisiéramos mostrar paquetes destacados
        return from(this.supabase
            .from('paquetes_proveedor')
            .select('*, perfil_proveedor(nombre_negocio)')
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    // ==========================================
    // Solicitudes (Eventos)
    // ==========================================
    getRequestsByClient(clientId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('*')
            .eq('cliente_usuario_id', clientId)
            .order('creado_en', { ascending: false })
        ).pipe(
            switchMap(({ data: requests, error }) => {
                if (error) {
                    if (error.code === '42P01') return of([]); // Table doesn't exist
                    throw error;
                }
                if (!requests || requests.length === 0) return of([]);

                // Extract unique provider IDs
                const providerIds = [...new Set(requests.map((r: any) => r.proveedor_usuario_id))];

                // Fetch provider profiles
                return from(this.supabase
                    .from('perfil_proveedor')
                    .select('*')
                    .in('usuario_id', providerIds)
                ).pipe(
                    map(({ data: profiles }) => {
                        const profilesMap = new Map(profiles?.map((p: any) => [p.usuario_id, p]));

                        // Merge requests with provider profiles
                        return requests.map((req: any) => ({
                            ...req,
                            perfil_proveedor: profilesMap.get(req.proveedor_usuario_id) || { nombre_negocio: 'Proveedor Desconocido' }
                        }));
                    })
                );
            })
        );
    }

    getRequestsByProvider(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('*, perfil_cliente(*)')
            .eq('proveedor_usuario_id', providerId)
            .order('creado_en', { ascending: false })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    async createRequest(requestData: any) {
        const { data, error } = await this.supabase
            .from('solicitudes')
            .insert([requestData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRequestStatus(id: string, status: string) {
        const { data, error } = await this.supabase
            .from('solicitudes')
            .update({ estado: status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Elimina una solicitud por ID
     */
    async deleteRequestById(id: string) {
        // Primero intentamos eliminar las cotizaciones asociadas si no hay cascade en DB
        // Esto es un "best effort"
        await this.supabase.from('cotizaciones').delete().eq('solicitud_id', id);

        const { error, count } = await this.supabase
            .from('solicitudes')
            .delete({ count: 'exact' })
            .eq('id', id);
            
        if (error) {
            console.error('Error DB delete:', error);
            throw error;
        }
        
        if (count === 0) {
            console.warn('No se eliminó ninguna fila. RLS o ID incorrecto.');
            throw new Error('No se pudo eliminar la solicitud de la base de datos (Permisos insuficientes o no encontrada).');
        }

        return { success: true, count };
    }

    // ==========================================
    // Paquetes
    // ==========================================
    async createProviderPackage(packageData: any) {
        console.log('📦 Creating package in DB:', packageData);
        const { data, error } = await this.supabase
            .from('paquetes_proveedor')
            .insert([packageData])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating package:', error);
            throw error;
        }
        console.log('✅ Package created:', data);
        return data;
    }

    async getServiceCategories(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('categorias_servicio')
            .select('*');

        if (error) {
            if (error.code === '42P01') return []; // If table doesn't exist yet
            throw error;
        }
        return data || [];
    }

    // ==========================================
    // Calendar Blocking (Disponibilidad)
    // ==========================================

    /**
     * Get occupied dates from requests with status 'Reservado' or 'Pagado'
     */
    getOccupiedDates(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('id, fecha_servicio, titulo_evento, direccion_servicio, estado')
            .eq('proveedor_usuario_id', providerId)
            .in('estado', ['reservado', 'Reservado', 'pagado', 'Pagado'])
            .order('fecha_servicio', { ascending: true })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    /**
     * Get manually blocked dates for a provider
     */
    getBlockedDates(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('disponibilidad_bloqueada')
            .select('*')
            .eq('provider_id', providerId)
            .order('fecha', { ascending: true })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    /**
     * Block a date manually
     */
    async blockDate(providerId: string, date: Date, motivo?: string) {
        const dateString = date.toISOString().split('T')[0];

        const { data, error } = await this.supabase
            .from('disponibilidad_bloqueada')
            .insert({
                provider_id: providerId,
                fecha: dateString,
                motivo: motivo || null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Unblock a previously blocked date
     */
    async unblockDate(blockId: string) {
        const { error } = await this.supabase
            .from('disponibilidad_bloqueada')
            .delete()
            .eq('id', blockId);

        if (error) throw error;
        return { success: true };
    }

    /**
     * Get all events (occupied + blocked) for a specific date
     */
    getEventsForDate(providerId: string, date: Date): Observable<any[]> {
        const dateString = date.toISOString().split('T')[0];

        return from(this.supabase
            .from('solicitudes')
            .select('*, perfil_cliente(nombre_completo, telefono)')
            .eq('proveedor_usuario_id', providerId)
            .gte('fecha_servicio', dateString)
            .lt('fecha_servicio', `${dateString}T23:59:59`)
            .in('estado', ['reservado', 'Reservado', 'pagado', 'Pagado', 'en_progreso'])
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }
}

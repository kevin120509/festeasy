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

    private formatDateISO(date: Date): string {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
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
            .select('*')
        ).pipe(
            switchMap(({ data: paquetes, error }) => {
                if (error && error.code === '42P01') return of([]);
                if (error) throw error;
                if (!paquetes || paquetes.length === 0) return of([]);

                // Resolver perfiles de proveedor manualmente
                const observables = paquetes.map((pkg: any) => {
                    return from(this.supabase
                        .from('perfil_proveedor')
                        .select('nombre_negocio, avatar_url')
                        .eq('usuario_id', pkg.proveedor_usuario_id)
                        .maybeSingle()
                    ).pipe(
                        map(({ data: provider }) => ({
                            ...pkg,
                            perfil_proveedor: provider
                        }))
                    );
                });
                return forkJoin(observables);
            })
        );
    }

    getPackageById(id: string): Observable<any> {
        return from(this.supabase
            .from('paquetes_proveedor')
            .select(`*, items_paquete:items_paquete(*)`)
            .eq('id', id)
            .single()
        ).pipe(
            switchMap(({ data: pkg, error }) => {
                if (error) throw error;
                if (!pkg) return of(null);

                // Resolver perfil de proveedor manualmente
                return from(this.supabase
                    .from('perfil_proveedor')
                    .select('*')
                    .eq('usuario_id', pkg.proveedor_usuario_id)
                    .maybeSingle()
                ).pipe(
                    map(({ data: provider }) => ({
                        ...pkg,
                        perfil_proveedor: provider
                    }))
                );
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
            switchMap(({ data: solicitudes, error }) => {
                if (error) {
                    if (error.code === '42P01') return of([]);
                    throw error;
                }
                if (!solicitudes || solicitudes.length === 0) return of([]);

                // Resolver perfiles de proveedor manualmente
                const observables = solicitudes.map((req: any) => {
                    return from(this.supabase
                        .from('perfil_proveedor')
                        .select('*')
                        .eq('usuario_id', req.proveedor_usuario_id)
                        .maybeSingle()
                    ).pipe(
                        map(({ data: provider }) => ({
                            ...req,
                            perfil_proveedor: provider
                        }))
                    );
                });
                return forkJoin(observables);
            })
        );
    }

    getRequestsByProvider(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('*')
            .eq('proveedor_usuario_id', providerId)
            .order('creado_en', { ascending: false })
        ).pipe(
            switchMap(({ data: solicitudes, error }) => {
                if (error && error.code === '42P01') return of([]);
                if (error) throw error;
                if (!solicitudes || solicitudes.length === 0) return of([]);

                // Resolver perfiles de cliente manualmente
                const observables = solicitudes.map((req: any) => {
                    return from(this.supabase
                        .from('perfil_cliente')
                        .select('*')
                        .eq('usuario_id', req.cliente_usuario_id)
                        .maybeSingle()
                    ).pipe(
                        map(({ data: clientProfile }) => ({
                            ...req,
                            perfil_cliente: clientProfile
                        }))
                    );
                });
                return forkJoin(observables);
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
            // Incluimos todos los estados que representen una solicitud activa (confirmada o pendiente)
            .in('estado', ['reservado', 'Reservado', 'pagado', 'Pagado', 'pendiente_aprobacion', 'esperando_anticipo', 'pendiente'])
            .order('fecha_servicio', { ascending: true })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return (data || []).map((item: any) => ({
                    ...item,
                    estado: item.estado.toLowerCase()
                }));
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
            .eq('proveedor_usuario_id', providerId)
            .order('fecha_bloqueada', { ascending: true })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    /**
     * Get all blocked providers for a specific date
     */
    getAllBlockedProvidersByDate(date: string): Observable<string[]> {
        return from(this.supabase
            .from('disponibilidad_bloqueada')
            .select('proveedor_usuario_id')
            .eq('fecha_bloqueada', date)
        ).pipe(
            map(({ data, error }) => {
                if (error) return [];
                return (data || []).map(b => b.proveedor_usuario_id);
            })
        );
    }

    /**
     * Get all occupied providers for a specific date
     */
    getAllOccupiedProvidersByDate(date: string): Observable<string[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('proveedor_usuario_id')
            .eq('fecha_servicio', date)
            .in('estado', ['reservado', 'Reservado', 'pagado', 'Pagado'])
        ).pipe(
            map(({ data, error }) => {
                if (error) return [];
                return (data || []).map(s => s.proveedor_usuario_id);
            })
        );
    }

    /**
     * Block a date manually
     */
    async blockDate(providerId: string, date: Date, motivo?: string) {
        const dateString = this.formatDateISO(date);

        const { data, error } = await this.supabase
            .from('disponibilidad_bloqueada')
            .insert({
                proveedor_usuario_id: providerId,
                fecha_bloqueada: dateString,
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
        const { error, count } = await this.supabase
            .from('disponibilidad_bloqueada')
            .delete({ count: 'exact' })
            .eq('id', blockId);

        if (error) throw error;
        return { success: true, count };
    }

    /**
     * Unblock a previously blocked date using providerId and date
     */
    async unblockDateByDate(providerId: string, dateISO: string) {
        const { error, count } = await this.supabase
            .from('disponibilidad_bloqueada')
            .delete({ count: 'exact' })
            .eq('proveedor_usuario_id', providerId)
            .eq('fecha_bloqueada', dateISO);

        if (error) throw error;
        return { success: true, count };
    }

    /**
     * Get all events (occupied + blocked) for a specific date
     */
    getEventsForDate(providerId: string, date: Date): Observable<any[]> {
        const dateString = this.formatDateISO(date);

        return from(this.supabase
            .from('solicitudes')
            .select('*, perfil_cliente(nombre_completo, telefono)')
            .eq('proveedor_usuario_id', providerId)
            .gte('fecha_servicio', dateString)
            .lt('fecha_servicio', `${dateString}T23:59:59`)
            // Incluimos todos los estados para que el proveedor vea qué hay en esa fecha
            .in('estado', ['reservado', 'Reservado', 'pagado', 'Pagado', 'en_progreso', 'pendiente_aprobacion', 'esperando_anticipo', 'pendiente'])
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }
}

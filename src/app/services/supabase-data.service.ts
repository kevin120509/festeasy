import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, forkJoin, of } from 'rxjs';
import { SubscriptionHistory, Addon, ProviderAddon, ProviderPublicPage } from '../models';

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
                        perfil_proveedor: provider as any // Cast to any to avoid array type mismatch
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
        console.log('🗑️ deleteRequestById: Iniciando eliminación de solicitud', id);

        // 1. Eliminar Items asociados
        const { error: errItems } = await this.supabase.from('items_solicitud').delete().eq('solicitud_id', id);
        if (errItems) console.warn('⚠️ Error al eliminar items:', errItems);

        // 2. Eliminar Pagos asociados
        const { error: errPagos } = await this.supabase.from('pagos').delete().eq('solicitud_id', id);
        if (errPagos) console.warn('⚠️ Error al eliminar pagos:', errPagos);

        // 3. Eliminar Reseñas asociadas
        const { error: errResenas } = await this.supabase.from('resenas').delete().eq('solicitud_id', id);
        if (errResenas) console.warn('⚠️ Error al eliminar reseñas:', errResenas);

        // 4. Eliminar Cotizaciones asociadas (Best effort)
        await this.supabase.from('cotizaciones').delete().eq('solicitud_id', id);

        // 5. Eliminar la Solicitud
        const { error, count } = await this.supabase
            .from('solicitudes')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error('❌ Error DB delete solicitud:', error);
            throw error;
        }

        if (count === 0) {
            console.warn('⚠️ No se eliminó ninguna fila. RLS o ID incorrecto.');
            throw new Error('No se pudo eliminar la solicitud de la base de datos.');
        }

        console.log('✅ Solicitud eliminada exitosamente del servidor');
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

    async createPackageItems(paqueteId: string, items: any[]) {
        if (!items || items.length === 0) return null;

        const itemsToInsert = items.map(item => ({
            paquete_id: paqueteId,
            nombre_item: item.nombre_item,
            cantidad: item.cantidad,
            producto_id: item.producto_id || null
        }));

        const { data, error } = await this.supabase
            .from('items_paquete')
            .insert(itemsToInsert)
            .select();

        if (error) {
            console.error('❌ Error creating package items:', error);
            throw error;
        }
        console.log('✅ Package items created:', data);
        return data;
    }

    async updatePackageItems(paqueteId: string, items: any[]) {
        // Primero eliminar los items existentes
        const { error: deleteError } = await this.supabase
            .from('items_paquete')
            .delete()
            .eq('paquete_id', paqueteId);

        if (deleteError) {
            console.error('❌ Error deleting old package items:', deleteError);
            throw deleteError;
        }

        // Luego insertar los nuevos items
        if (items && items.length > 0) {
            return await this.createPackageItems(paqueteId, items);
        }
        return null;
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

    /**
     * Actualiza el plan de suscripción de un proveedor
     * @param providerId ID del usuario proveedor
     * @param plan Plan de suscripción ('basico', 'pro', 'premium')
     * @param amount Monto pagado por la suscripción
     */
    async upgradeProviderSubscription(providerId: string, plan: string, amount: number, addons: string[] = []): Promise<void> {
        try {
            // Operación 1: Actualizar el perfil del proveedor (Plan y Columna de Addons)
            const { error: profileError } = await this.supabase
                .from('perfil_proveedor')
                .update({
                    tipo_suscripcion_actual: plan.toLowerCase(),
                    addons: addons // Sincroniza la columna JSONB
                })
                .eq('usuario_id', providerId);

            if (profileError) {
                console.error('❌ Error al actualizar el perfil del proveedor:', profileError);
                throw new Error(`Error al actualizar el perfil del proveedor: ${profileError.message}`);
            }

            // Operación 2: Activar Addons en la tabla junction 'provider_addons'
            if (addons.length > 0) {
                const addonRecords = addons.map(code => ({
                    provider_id: providerId,
                    addon_code: code,
                    status: 'active'
                }));

                const { error: addonsError } = await this.supabase
                    .from('provider_addons')
                    .upsert(addonRecords, { onConflict: 'provider_id,addon_code' });

                if (addonsError) {
                    console.warn('⚠️ Error al activar addons en provider_addons:', addonsError.message);
                }
            }

            // Operación 3: Crear registro en historial de suscripciones
            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setMonth(fechaFin.getMonth() + 1); // 1 mes de vigencia

            const subscriptionRecord: Partial<SubscriptionHistory> = {
                proveedor_usuario_id: providerId,
                plan: plan.toLowerCase() as 'festeasy' | 'libre',
                monto_pagado: amount,
                fecha_inicio: fechaInicio.toISOString(),
                fecha_fin: fechaFin.toISOString(),
                estado_pago: 'pagado'
            };

            const { error: historyError } = await this.supabase
                .from('historial_suscripciones')
                .insert([subscriptionRecord]);

            if (historyError) {
                console.warn('⚠️ No se pudo registrar en historial_suscripciones:', historyError.message);
            }

            console.log('✅ Suscripción y addons actualizados exitosamente para:', providerId);
        } catch (error: any) {
            console.error('❌ Error en upgradeProviderSubscription:', error);
            throw error;
        }
    }

    async getProviderAddonsCodes(providerId: string): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('provider_addons')
            .select('addon_code')
            .eq('provider_id', providerId)
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching provider addons codes:', error);
            return [];
        }
        console.log('📦 Raw addon data from DB:', data);
        const codes = data.map(a => a.addon_code);
        console.log('📦 Mapped addon codes:', codes);
        return codes;
    }

    // ==========================================
    // Admin & Metrics
    // ==========================================

    /**
     * Obtiene estadísticas globales para el Dashboard Admin
     */
    async getAdminDashboardStats() {
        try {
            // 1. Total Usuarios (Clientes + Proveedores)
            const { count: clientCount } = await this.supabase.from('perfil_cliente').select('*', { count: 'exact', head: true });
            const { count: providerCount } = await this.supabase.from('perfil_proveedor').select('*', { count: 'exact', head: true });

            // 2. Proveedores Pendientes
            const { count: pendingCount } = await this.supabase
                .from('perfil_proveedor')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'pendiente');

            // 3. Solicitudes de hoy
            const today = new Date().toISOString().split('T')[0];
            const { count: todayRequests } = await this.supabase
                .from('solicitudes')
                .select('*', { count: 'exact', head: true })
                .gte('creado_en', today);

            // 4. Ingresos del mes (suscripciones)
            const firstDayMonth = new Date();
            firstDayMonth.setDate(1);
            const { data: payments } = await this.supabase
                .from('historial_suscripciones')
                .select('monto_pagado')
                .gte('creado_en', firstDayMonth.toISOString())
                .eq('estado_pago', 'pagado');

            const totalIncome = (payments || []).reduce((sum, p) => sum + (p.monto_pagado || 0), 0);

            return {
                totalUsuarios: (clientCount || 0) + (providerCount || 0),
                totalProveedores: providerCount || 0,
                totalClientes: clientCount || 0,
                proveedoresPendientes: pendingCount || 0,
                solicitudesHoy: todayRequests || 0,
                ingresosMes: totalIncome
            };
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            throw error;
        }
    }

    /**
     * Obtiene actividad reciente (Suscripciones y Cancelaciones)
     */
    async getRecentAdminActivity() {
        try {
            // Traer últimas 5 suscripciones
            const { data: subs } = await this.supabase
                .from('historial_suscripciones')
                .select(`
                    id, 
                    created_at:creado_en, 
                    plan, 
                    monto_pagado,
                    proveedor:perfil_proveedor(nombre_negocio)
                `)
                .order('creado_en', { ascending: false })
                .limit(5);

            // Traer últimas 5 cancelaciones
            const { data: cancels } = await this.supabase
                .from('solicitudes')
                .select(`
                    id, 
                    created_at:creado_en, 
                    estado, 
                    proveedor:perfil_proveedor(nombre_negocio)
                `)
                .eq('estado', 'cancelada')
                .order('creado_en', { ascending: false })
                .limit(5);

            const activity = [
                ...(subs as any[] || []).map(s => {
                    const prov = Array.isArray(s.proveedor) ? s.proveedor[0] : s.proveedor;
                    return {
                        tipo: 'pago',
                        mensaje: `Suscripción ${(s.plan || 'Base').toUpperCase()} - ${prov?.nombre_negocio || 'Proveedor'} ($${s.monto_pagado || 0})`,
                        tiempo: s.created_at,
                        icono: 'payments'
                    };
                }),
                ...(cancels as any[] || []).map(c => {
                    const prov = Array.isArray(c.proveedor) ? c.proveedor[0] : c.proveedor;
                    return {
                        tipo: 'cancelacion',
                        mensaje: `Cancelada: Solicitud para ${prov?.nombre_negocio || 'Proveedor'}`,
                        tiempo: c.created_at,
                        icono: 'cancel'
                    };
                })
            ].sort((a, b) => new Date(b.tiempo).getTime() - new Date(a.tiempo).getTime());

            return activity.slice(0, 10);
        } catch (error) {
            console.error('Error fetching admin activity:', error);
            return [];
        }
    }

    /**
     * Obtiene lista completa de proveedores para la tabla central
     */
    async getAllProvidersDetailed() {
        try {
            // 1. Obtener perfiles de proveedor
            const { data: providers, error: pError } = await this.supabase
                .from('perfil_proveedor')
                .select('*')
                .order('creado_en', { ascending: false });

            if (pError) throw pError;
            if (!providers || providers.length === 0) return [];

            // 2. Obtener historiales de suscripción de forma masiva
            const { data: history, error: hError } = await this.supabase
                .from('historial_suscripciones')
                .select('*')
                .order('fecha_fin', { ascending: false });

            // Si falla la tabla de historial, simplemente retornamos los perfiles sin sub
            const safeHistory = history || [];

            // 3. Unir en memoria
            return providers.map((p: any) => {
                const providerHistory = safeHistory.filter((h: any) => h.proveedor_id === p.id || h.usuario_id === p.usuario_id);
                return { 
                    ...p, 
                    latest_subscription: providerHistory[0] || null,
                    historial_suscripciones: providerHistory
                };
            });
        } catch (error: any) {
            console.error('Error en getAllProvidersDetailed:', error);
            // Si la tabla no existe (42P01), fallamos silenciosamente retornando vacío
            if (error?.code === '42P01') return [];
            throw error;
        }
    }

    /**
     * Obtiene todos los clientes registrados
     */
    async getAllClientsDetailed() {
        const { data, error } = await this.supabase
            .from('perfil_cliente')
            .select('*')
            .order('creado_en', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Actualiza el estado de un usuario (cliente o proveedor)
     */
    async updateUserStatus(id: string, role: 'client' | 'provider', newStatus: 'active' | 'blocked') {
        const table = role === 'provider' ? 'perfil_proveedor' : 'perfil_cliente';
        const { data, error } = await this.supabase
            .from(table)
            .update({ estado: newStatus })
            .eq('usuario_id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Permite al admin modificar el precio de un paquete
     */
    async updatePackagePrice(packageId: string, newPrice: number) {
        const { data, error } = await this.supabase
            .from('paquetes_proveedor')
            .update({ precio_base: newPrice })
            .eq('id', packageId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getSubscriptionConfigs() {
        const { data, error } = await this.supabase
            .from('configuracion_planes')
            .select('*')
            .order('precio', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    async updatePlanPrice(planId: string, newPrice: number) {
        const { error } = await this.supabase
            .from('configuracion_planes')
            .update({ precio: newPrice })
            .eq('id', planId);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Web Builder & Addons
    // ==========================================

    async hasAddon(providerId: string, addonCode: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('provider_addons')
            .select('id')
            .eq('provider_id', providerId)
            .eq('addon_code', addonCode)
            .eq('status', 'active')
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    async getProviderPublicPage(slug: string): Promise<ProviderPublicPage | null> {
        const { data, error } = await this.supabase
            .from('provider_public_page')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data as ProviderPublicPage;
    }

    async getProviderPublicPageByProviderId(providerId: string): Promise<ProviderPublicPage | null> {
        const { data, error } = await this.supabase
            .from('provider_public_page')
            .select('*')
            .eq('provider_id', providerId)
            .maybeSingle();

        if (error) throw error;
        return data as ProviderPublicPage;
    }

    async upsertProviderPublicPage(pageData: Partial<ProviderPublicPage>): Promise<ProviderPublicPage> {
        const { data, error } = await this.supabase
            .from('provider_public_page')
            .upsert({
                ...pageData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as ProviderPublicPage;
    }
}


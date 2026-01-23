import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, from, map, switchMap } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import {
    User, ClientProfile, ProviderProfile, Cart, CartItem,
    ServiceRequest, Quote, Payment, ProviderPackage
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private supabaseService = inject(SupabaseService);
    private supabase: SupabaseClient;
    private auth = inject(AuthService);

    constructor() {
        this.supabase = this.supabaseService.getClient();
    }

    private http = inject(HttpClient);
    private API_URL = 'https://api.backend.com';

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    private fromSupabase<T>(promise: any): Observable<T> {
        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data as T;
            })
        );
    }

    async getCurrentUser() {
        return await this.supabase.auth.getUser();
    }

    // ==========================================
    // 1. Autenticación (/users)
    // ==========================================
    register(data: { correo_electronico: string; contrasena: string; rol: string }): Observable<any> {
        return from(this.supabase.auth.signUp({
            email: data.correo_electronico,
            password: data.contrasena,
            options: { data: { rol: data.rol } }
        })).pipe(
            map(res => {
                if (res.error) throw res.error;
                console.log('✅ Usuario registrado:', res.data);
                return res.data;
            }),
            catchError(error => {
                console.error('❌ Error en register():', error);
                return throwError(() => error);
            })
        );
    }

    login(correo_electronico: string, contrasena: string): Observable<any> {
        return from(this.supabase.auth.signInWithPassword({
            email: correo_electronico,
            password: contrasena
        })).pipe(
            map(res => {
                if (res.error) throw res.error;
                console.log('✅ Login exitoso:', res.data);
                return { token: res.data.session?.access_token, user: res.data.user };
            }),
            catchError(error => {
                console.error('❌ Error en login():', error);
                if (error.status === 401) {
                    console.error('⚠️ Credenciales incorrectas');
                }
                return throwError(() => error);
            })
        );
    }

    getUser(id: string): Observable<User> {
        return this.http.get<User>(`${this.API_URL}/users/${id}`, { headers: this.getHeaders() });
    }

    updateUser(id: string, data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/users/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 1B. Autenticación Proveedores Independientes
    // ==========================================
    registerProvider(data: {
        correo_electronico: string;
        contrasena: string;
        nombre_negocio: string;
        descripcion?: string;
        telefono?: string;
        direccion_formato?: string;
        categoria_principal_id?: string;
    }): Observable<any> {
        return from(this.supabase.auth.signUp({
            email: data.correo_electronico,
            password: data.contrasena,
            options: { data: { rol: 'provider', ...data } }
        })).pipe(
            map(res => {
                if (res.error) throw res.error;
                console.log('✅ Proveedor registrado:', res.data);
                return res.data;
            }),
            catchError(error => {
                console.error('❌ Error en registerProvider():', error);
                return throwError(() => error);
            })
        );
    }

    loginProvider(correo_electronico: string, contrasena: string): Observable<any> {
        return this.login(correo_electronico, contrasena);
    }

    // ==========================================
    // 2. Perfil Cliente (/perfil-cliente)
    // ==========================================
    createClientProfile(data: Partial<ClientProfile>): Observable<ClientProfile> {
        return this.fromSupabase<ClientProfile>( // Explicit Generic
            this.supabase.from('perfil_cliente').insert(data).select().single()
        ).pipe(
            tap((response: ClientProfile) => console.log('✅ Perfil cliente creado:', response)), // Explicit type
            catchError(error => {
                console.error('❌ Error en createClientProfile():', error);
                return throwError(() => error);
            })
        );
    }

    getClientProfiles(): Observable<ClientProfile[]> {
        return this.http.get<ClientProfile[]>(`${this.API_URL}/perfil-cliente`, { headers: this.getHeaders() });
    }

    getClientProfile(userId: string): Observable<ClientProfile> {
        return this.fromSupabase<ClientProfile>(
            this.supabase.from('perfil_cliente').select('*').eq('usuario_id', userId).single()
        );
    }

    updateClientProfile(id: string, data: Partial<ClientProfile>): Observable<ClientProfile> {
        return this.fromSupabase<ClientProfile>(
            this.supabase.from('perfil_cliente').update(data).eq('id', id).select().single()
        );
    }

    // ==========================================
    // 3. Perfil Proveedor (/perfil-proveedor)
    // ==========================================
    createProviderProfile(data: Partial<ProviderProfile>): Observable<ProviderProfile> {
        console.log('📤 Creando perfil proveedor con datos:', data);
        return this.fromSupabase<ProviderProfile>( // Explicit Generic
            this.supabase.from('perfil_proveedor').insert(data).select().single()
        ).pipe(
            tap((response: ProviderProfile) => console.log('✅ Perfil proveedor creado:', response)), // Explicit type
            catchError(error => {
                console.error('❌ Error en createProviderProfile():', error);
                return throwError(() => error);
            })
        );
    }

    // PROFILES
    getProviderProfiles(): Observable<ProviderProfile[]> {
        return this.fromSupabase(this.supabase.from('perfil_proveedor').select('*').eq('estado', 'active').not('usuario_id', 'is', null));
    }

    getProviderProfile(id: string): Observable<ProviderProfile> {
        return this.fromSupabase(this.supabase.from('perfil_proveedor').select('*').or(`id.eq.${id},usuario_id.eq.${id}`).single());
    }

    // PACKAGES
    getPackagesByProviderId(providerUserId: string): Observable<ProviderPackage[]> {
        console.log('🔍 API: Buscando paquetes para:', providerUserId);
        // Buscar paquetes solo por usuario_id (no usar .user() de Supabase JS v2)
        return this.fromSupabase<ProviderPackage[]>(
            this.supabase
                .from('paquetes_proveedor')
                .select('*, categoria:categorias_servicio(nombre)')
                .eq('proveedor_usuario_id', providerUserId)
            // .eq('estado', 'publicado') // Allow all packages for now
        ).pipe(
            map(packages => {
                console.log('🔍 API: Paquetes encontrados (por usuario_id):', packages);
                return packages;
            })
        );
    }

    getServiceCategories(): Observable<any[]> {
        return this.fromSupabase(this.supabase.from('categorias_servicio').select('*'));
    }

    getProvidersWithLocation(): Observable<any[]> {
        // Obtenemos perfiles de proveedores con sus coordenadas y categoría
        return this.fromSupabase(
            this.supabase
                .from('perfil_proveedor')
                .select('id, nombre_negocio, latitud, longitud, categoria_principal_id, avatar_url, descripcion, direccion_formato, usuario_id')
        );
    }

    // REQUESTS
    createRequest(data: any): Observable<any> {
        return from(this.supabase.auth.getUser()).pipe(
            switchMap(({ data: { user }, error }: any) => {
                if (error) return throwError(() => error);
                if (!user) {
                    return throwError(() => new Error('Sesión de Supabase no válida. Vuelve a iniciar sesión.'));
                }

                const payload = {
                    ...data,
                    cliente_usuario_id: user.id,
                };

                return this.fromSupabase(this.supabase.from('solicitudes').insert(payload).select().single());
            })
        );
    }

    createSolicitudItems(items: any[]): Observable<any> {
        console.log('🔁 API: Insertando items_solicitud:', items);
        return this.fromSupabase(this.supabase.from('items_solicitud').insert(items).select()).pipe(
            tap((res: any) => console.log('✅ API: items_solicitud insertados:', res)),
            catchError(err => {
                console.error('❌ API: Error insertando items_solicitud:', err);
                return throwError(() => err);
            })
        );
    }

    async debugCurrentUser() {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error) throw error;
        return user;
    }

    // MISSING METHODS ADDED HERE
    createQuote(data: Partial<Quote>): Observable<Quote> {
        return this.fromSupabase(this.supabase.from('cotizaciones').insert(data).select().single());
    }

    updateRequestStatus(id: string, status: string): Observable<any> {
        return this.fromSupabase(this.supabase.from('solicitudes').update({ estado: status }).eq('id', id).select().single());
    }


    getClientRequests(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(map(u => {
            return this.supabase.from('solicitudes').select('*, provider:perfil_proveedor(*)').eq('cliente_usuario_id', u.data.user?.id);
        })) as any;
    }

    // Obtener solicitudes del cliente con datos completos
    getClientRequestsReal(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(
            switchMap((res: any) => {
                if (res.error) throw res.error;
                const userId = res.data.user?.id;
                if (!userId) return [];

                // Solicitudes sin JOIN - no hay FK directa a perfil_proveedor
                return from(this.supabase
                    .from('solicitudes')
                    .select('*')
                    .eq('cliente_usuario_id', userId)
                    .order('creado_en', { ascending: false })
                );
            }),
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data || [];
            })
        );
    }

    // Obtener solicitudes del proveedor (para que pueda aceptar/rechazar)
    getProviderRequestsReal(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(
            switchMap((res: any) => {
                if (res.error) throw res.error;
                const userId = res.data.user?.id;
                if (!userId) return [];

                // JOIN con perfil_cliente usando la nueva FK
                return from(this.supabase
                    .from('solicitudes')
                    .select('*, cliente:perfil_cliente!solicitudes_cliente_perfil_fkey(nombre_completo, telefono, avatar_url)')
                    .eq('proveedor_usuario_id', userId)
                    .order('creado_en', { ascending: false })
                );
            }),
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data || [];
            })
        );
    }

    // Actualizar estado de solicitud (para proveedor aceptar/rechazar)
    updateSolicitudEstado(id: string, estado: string): Observable<any> {
        return this.fromSupabase(
            this.supabase
                .from('solicitudes')
                .update({ estado })
                .eq('id', id)
                .select()
                .single()
        );
    }

    // ... (Agregando los demás métodos necesarios para que compile el resto de la app)
    updateProviderProfile(id: string, data: any): Observable<any> { return this.fromSupabase(this.supabase.from('perfil_proveedor').update(data).eq('id', id).select().single()); }

    // Obtener carrito activo del usuario actual
    getCart(): Observable<any> {
        return from(this.supabase.auth.getUser()).pipe(
            switchMap((res: any) => {
                if (res.error) throw res.error;
                const userId = res.data.user?.id;
                console.log('🛒 getCart: userId =', userId);
                if (!userId) throw new Error('Usuario no autenticado');

                return from(this.supabase
                    .from('carrito')
                    .select('*, items:items_carrito(*, paquete:paquetes_proveedor(*))')
                    .eq('cliente_usuario_id', userId)
                    .eq('estado', 'activo')
                    .maybeSingle()
                );
            }),
            map((res: any) => {
                console.log('🛒 getCart: resultado =', res);
                if (res.error) throw res.error;
                return res.data || { items: [] };
            })
        );
    }

    // Crear carrito si no existe
    async getOrCreateCart(): Promise<any> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Buscar carrito activo
        const { data: existingCart, error: findError } = await this.supabase
            .from('carrito')
            .select('*, items:items_carrito(*)')
            .eq('cliente_usuario_id', user.id)
            .eq('estado', 'activo')
            .maybeSingle();

        if (findError) throw findError;

        if (existingCart) {
            return existingCart;
        }

        // Crear nuevo carrito
        const { data: newCart, error: createError } = await this.supabase
            .from('carrito')
            .insert({ cliente_usuario_id: user.id, estado: 'activo' })
            .select()
            .single();

        if (createError) throw createError;
        return { ...newCart, items: [] };
    }

    // Métodos para carrito
    addToCart(item: Partial<CartItem>): Observable<any> {
        return this.fromSupabase(this.supabase.from('items_carrito').insert(item).select().single());
    }

    deleteCartItem(id: string): Observable<any> {
        return this.fromSupabase(this.supabase.from('items_carrito').delete().eq('id', id));
    }

    // Métodos para calendario/agenda del proveedor
    getCalendarBlocks(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(
            map((u: any) => u.data.user?.id),
            map(userId => this.fromSupabase(this.supabase.from('bloqueos_calendario').select('*').eq('proveedor_usuario_id', userId)))
        ) as any;
    }

    createCalendarBlock(data: any): Observable<any> {
        return from(this.supabase.auth.getUser()).pipe(
            map((u: any) => ({
                ...data,
                proveedor_usuario_id: u.data.user?.id,
                fecha_bloqueada: data.fecha
            })),
            map(blockData => this.fromSupabase(this.supabase.from('bloqueos_calendario').insert(blockData).select().single()))
        ) as any;
    }

    deleteCalendarBlock(id: string): Observable<any> {
        return this.fromSupabase(this.supabase.from('bloqueos_calendario').delete().eq('id', id));
    }

    // Solicitudes del proveedor
    getProviderRequests(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(
            map((u: any) => u.data.user?.id),
            map(userId => this.fromSupabase(this.supabase.from('solicitudes').select('*, cliente:perfil_cliente(*)').eq('proveedor_usuario_id', userId)))
        ) as any;
    }

    getRequestById(id: string): Observable<any> {
        return from(this.supabase
            .from('solicitudes')
            .select('*, client:perfil_cliente!solicitudes_cliente_perfil_fkey(*)')
            .eq('id', id)
            .single()
        ).pipe(
            switchMap(({ data: request, error }) => {
                if (error) throw error;
                if (!request) throw new Error('Solicitud no encontrada');

                // Obtener perfil del proveedor manualmente (opcional si ya viene en el objeto o no se usa)
                return from(this.supabase
                    .from('perfil_proveedor')
                    .select('*')
                    .eq('usuario_id', request.proveedor_usuario_id)
                    .single()
                ).pipe(
                    map(({ data: profile }) => ({
                        ...request,
                        perfil_proveedor: profile
                    }))
                );
            })
        );
    }

    getRequestItems(solicitudId: string): Observable<any[]> {
        return from(this.supabase
            .from('items_solicitud')
            .select('*')
            .eq('solicitud_id', solicitudId)
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data || [];
            })
        );
    }

    // Reviews
    getReviews(proveedorId?: string): Observable<any[]> {
        let query = this.supabase.from('resenas').select('*');
        if (proveedorId) {
            query = query.eq('destinatario_id', proveedorId);
        }
        return this.fromSupabase(query);
    }

    // Paquetes del proveedor - Versión que obtiene todos
    getProviderPackages(): Observable<ProviderPackage[]> {
        return this.fromSupabase(this.supabase.from('paquetes_proveedor').select('*'));
    }

    // Obtener paquetes de una lista de proveedores para filtrado avanzado
    getPackagesByProviderIds(providerIds: string[]): Observable<any[]> {
        if (!providerIds.length) return new Observable(obs => obs.next([]));

        return this.fromSupabase(
            this.supabase
                .from('paquetes_proveedor')
                .select('proveedor_usuario_id, categoria_servicio_id, categoria:categorias_servicio(nombre, id)')
                .in('proveedor_usuario_id', providerIds)
        );
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, from, map, switchMap, forkJoin, of } from 'rxjs';
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
                    pin_validacion: Math.floor(1000 + Math.random() * 9000).toString(),
                    estado: data.estado || 'pendiente_aprobacion'
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
            return this.supabase.from('solicitudes').select('*').eq('cliente_usuario_id', u.data.user?.id);
        })) as any;
    }

    // Obtener solicitudes del cliente con datos completos (Resiliente a falta de FK)
    getClientRequestsReal(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(
            switchMap((authRes: any) => {
                const userId = authRes.data.user?.id;
                if (!userId) return of([]);

                return from(this.supabase
                    .from('solicitudes')
                    .select('*')
                    .eq('cliente_usuario_id', userId)
                    .order('creado_en', { ascending: false })
                ).pipe(
                    switchMap((res: any) => {
                        if (res.error) throw res.error;
                        const solicitudes = res.data || [];
                        if (solicitudes.length === 0) return of([]);

                        // Resolver perfiles de proveedor para cada solicitud de forma paralela
                        const observables = solicitudes.map((req: any) => {
                            return from(this.supabase
                                .from('perfil_proveedor')
                                .select('*')
                                .eq('usuario_id', req.proveedor_usuario_id)
                                .maybeSingle()
                            ).pipe(
                                map(({ data: provider }) => ({
                                    ...req,
                                    provider: provider || { nombre_negocio: 'Proveedor no encontrado' }
                                }))
                            );
                        });
                        return forkJoin(observables) as Observable<any[]>;
                    })
                );
            })
        );
    }

    // Obtener solicitudes del proveedor (para que pueda aceptar/rechazar)
    getProviderRequestsReal(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(
            switchMap((authRes: any) => {
                const user = authRes.data.user;
                if (!user) return of([]);

                const userId = user.id;

                // Usar select explícito con la FK para asegurar que Supabase traiga los perfiles
                // Usamos el alias 'cliente' para que coincida con nuestro modelo ServiceRequest
                return from(this.supabase
                    .from('solicitudes')
                    .select(`
                        *,
                        cliente:perfil_cliente!solicitudes_cliente_perfil_fkey (
                            nombre_completo,
                            telefono,
                            avatar_url
                        )
                    `)
                    .eq('proveedor_usuario_id', userId)
                    .order('creado_en', { ascending: false })
                );
            }),
            switchMap((res: any) => {
                console.log('🔍 RAW Supabase Response (Provider Requests):', res.data);
                if (res.error) {
                    console.error('❌ Error en getProviderRequestsReal:', res.error);
                    return of([]);
                }

                const solicitudes = res.data || [];
                console.log('🔍 Muestra de datos RAW (Primera Solicitud):', JSON.stringify(solicitudes[0], null, 2));

                if (solicitudes.length === 0) return of([]);

                // Procesar cada solicitud para buscar perfil de proveedor si el de cliente falta
                const observables = solicitudes.map((req: any) => {
                    const rawJoin = req.cliente;
                    const clienteData = Array.isArray(rawJoin) ? rawJoin[0] : rawJoin;

                    if (clienteData?.nombre_completo) {
                        console.log(`✅ Nombre encontrado vía JOIN para solicitud ${req.id}:`, clienteData.nombre_completo);
                        return of({ ...req, cliente: clienteData });
                    }

                    console.log(`⚠️ Solicitud ${req.id} sin nombre vía JOIN. Buscando en perfil_cliente para user_id: ${req.cliente_usuario_id}`);

                    // FALLBACK: Buscar secuencialmente en perfil_cliente y luego en perfil_proveedor
                    return from(this.supabase
                        .from('perfil_cliente')
                        .select('nombre_completo, telefono, avatar_url')
                        .eq('usuario_id', req.cliente_usuario_id)
                        .maybeSingle()
                    ).pipe(
                        switchMap(({ data: pCliente, error: errC }) => {
                            if (errC) console.error(`❌ Error rescatando perfil_cliente para ${req.id}:`, errC);

                            if (pCliente?.nombre_completo) {
                                console.log(`✅ Nombre rescatado de perfil_cliente para ${req.id}:`, pCliente.nombre_completo);
                                return of({ ...req, cliente: pCliente });
                            }

                            console.log(`⚠️ No se encontró perfil_cliente para ${req.id}. Buscando en perfil_proveedor...`);

                            // Si no hay perfil_cliente, buscar en perfil_proveedor
                            return from(this.supabase
                                .from('perfil_proveedor')
                                .select('nombre_negocio, telefono, avatar_url')
                                .eq('usuario_id', req.cliente_usuario_id)
                                .maybeSingle()
                            ).pipe(
                                map(({ data: prov, error: errP }) => {
                                    if (errP) console.error(`❌ Error rescatando perfil_proveedor para ${req.id}:`, errP);

                                    const provData = prov as any;
                                    const finalCliente = prov ? {
                                        nombre_completo: provData.nombre_negocio || provData.nombre_completo || 'Proveedor como Cliente',
                                        telefono: provData.telefono,
                                        avatar_url: provData.avatar_url
                                    } : null;

                                    if (finalCliente) {
                                        console.log(`✅ Nombre rescatado de perfil_proveedor para ${req.id}:`, finalCliente.nombre_completo);
                                    } else {
                                        console.warn(`🛑 NO SE ENCONTRÓ NINGÚN PERFIL para user_id: ${req.cliente_usuario_id} en solicitud ${req.id}`);
                                    }

                                    return {
                                        ...req,
                                        cliente: finalCliente
                                    };
                                })
                            );
                        })
                    );
                });
                return forkJoin(observables) as Observable<any[]>;
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
            .select(`
                        *,
                        cliente: perfil_cliente!solicitudes_cliente_perfil_fkey(
                            id,
                            nombre_completo,
                            telefono,
                            avatar_url
                        )
                        `)
            .eq('id', id)
            .single()
        ).pipe(
            switchMap(({ data: request, error }) => {
                if (error) {
                    console.error('❌ Error cargando solicitud base:', error);
                    // Como último recurso, intentar sin el JOIN si este falló por RLS de la relación
                    return from(this.supabase.from('solicitudes').select('*').eq('id', id).single()).pipe(
                        map(res => res.data)
                    );
                }
                return of(request);
            }),
            switchMap((request: any) => {
                if (!request) return throwError(() => new Error('Solicitud no encontrada'));

                const rawCliente = request.cliente;
                const clienteExistente = Array.isArray(rawCliente) ? rawCliente[0] : rawCliente;

                return forkJoin({
                    provider: from(this.supabase.from('perfil_proveedor').select('*').eq('usuario_id', request.proveedor_usuario_id).maybeSingle()),
                    clientManual: clienteExistente?.nombre_completo ? of({ data: clienteExistente }) : from(this.supabase.from('perfil_cliente').select('*').eq('usuario_id', request.cliente_usuario_id).maybeSingle()),
                    clientAsProvider: (clienteExistente?.nombre_completo || false) ? of({ data: null }) : from(this.supabase.from('perfil_proveedor').select('nombre_negocio, telefono, avatar_url').eq('usuario_id', request.cliente_usuario_id).maybeSingle())
                }).pipe(
                    map(({ provider, clientManual, clientAsProvider }: any) => {
                        let clienteData = clientManual.data || clienteExistente;

                        // Si después de todo sigue sin haber nombre, usar los datos de proveedor si existen
                        if (!clienteData?.nombre_completo && clientAsProvider.data) {
                            clienteData = {
                                nombre_completo: clientAsProvider.data.nombre_negocio || clientAsProvider.data.nombre_completo,
                                telefono: clientAsProvider.data.telefono,
                                avatar_url: clientAsProvider.data.avatar_url
                            };
                        }

                        return {
                            ...request,
                            perfil_proveedor: provider.data,
                            cliente: clienteData
                        };
                    })
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

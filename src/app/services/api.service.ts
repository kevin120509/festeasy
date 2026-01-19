import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, from, map } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    User, ClientProfile, ProviderProfile, Cart, CartItem,
    ServiceRequest, Quote, Payment, ProviderPackage
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private supabase: SupabaseClient;
    private auth = inject(AuthService);

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
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

    getClientProfile(id: string): Observable<ClientProfile> {
        return this.http.get<ClientProfile>(`${this.API_URL}/perfil-cliente/${id}`, { headers: this.getHeaders() });
    }

    updateClientProfile(id: string, data: Partial<ClientProfile>): Observable<ClientProfile> {
        // Backend usa token para identificar usuario, ignoramos ID
        return this.http.put<ClientProfile>(`${this.API_URL}/perfil`, data, { headers: this.getHeaders() });
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
        return this.fromSupabase(this.supabase.from('perfil_proveedor').select('*'));
    }

    getProviderProfile(id: string): Observable<ProviderProfile> {
        return this.fromSupabase(this.supabase.from('perfil_proveedor').select('*').or(`id.eq.${id},usuario_id.eq.${id}`).single());
    }

    // PACKAGES
    getPackagesByProviderId(providerUserId: string): Observable<ProviderPackage[]> {
        return this.fromSupabase(this.supabase.from('paquetes_proveedor').select('*').eq('proveedor_usuario_id', providerUserId));
    }

    getServiceCategories(): Observable<any[]> {
        return this.fromSupabase(this.supabase.from('categorias_servicio').select('*'));
    }

    // REQUESTS
    createRequest(data: any): Observable<any> {
        return this.fromSupabase(this.supabase.from('solicitudes').insert(data).select().single());
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
    
    // ... (Agregando los demás métodos necesarios para que compile el resto de la app)
    updateProviderProfile(id: string, data: any): Observable<any> { return this.fromSupabase(this.supabase.from('perfil_proveedor').update(data).eq('id', id).select().single()); }
    getCart(): Observable<any> { return this.fromSupabase(this.supabase.from('carrito').select('*, items:items_carrito(*)').eq('estado', 'activo').limit(1)); }
    
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
}

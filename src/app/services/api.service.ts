import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
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

    private fromSupabase<T>(promise: any): Observable<T> {
        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data as T;
            })
        );
    }

    // AUTH
    register(data: any): Observable<any> {
        return from(this.supabase.auth.signUp({
            email: data.correo_electronico,
            password: data.contrasena,
            options: { data: { rol: data.rol } }
        })).pipe(map(res => { if (res.error) throw res.error; return res.data; }));
    }

    login(email: string, pass: string): Observable<any> {
        return from(this.supabase.auth.signInWithPassword({ email, password: pass }))
            .pipe(map(res => { if (res.error) throw res.error; return { token: res.data.session?.access_token, user: res.data.user }; }));
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

    getClientRequests(): Observable<any[]> {
        return from(this.supabase.auth.getUser()).pipe(map(u => {
            return this.supabase.from('solicitudes').select('*, provider:perfil_proveedor(*)').eq('cliente_usuario_id', u.data.user?.id);
        })) as any;
    }
    
    // ... (Agregando los demás métodos necesarios para que compile el resto de la app)
    updateProviderProfile(id: string, data: any): Observable<any> { return this.fromSupabase(this.supabase.from('perfil_proveedor').update(data).eq('id', id).select().single()); }
    getCart(): Observable<any> { return this.fromSupabase(this.supabase.from('carrito').select('*, items:items_carrito(*)').eq('estado', 'activo').limit(1)); }
}
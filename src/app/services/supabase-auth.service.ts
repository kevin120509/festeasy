import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseAuthService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    // Registrar usuario
    async signUp(email: string, password: string, metadata: any) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // nombre_negocio, rol, etc.
            }
        });

        if (error) throw error;

        // Sync with public.users table (Required by legacy schema FKs)
        if (data.user) {
            const { error: dbError } = await this.supabase
                .from('users')
                .insert([{
                    id: data.user.id,
                    correo_electronico: email,
                    contrasena: password, // Legacy schema requires this column (Not Null)
                    rol: metadata.rol || 'client',
                    estado: 'active'
                }])
                .select()
                .single();

            if (dbError) {
                // Ignore duplicate key error (if user was already synced)
                if (dbError.code !== '23505') {
                    console.error('Error syncing public.users:', dbError);
                    // We don't throw here to allow Auth flow to continue, 
                    // but Profile creation might fail later if this didn't work.
                }
            }
        }

        return data;
    }

    // Iniciar sesión
    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    // Crear perfil de proveedor
    async createProviderProfile(profile: any) {
        // En Supabase, la tabla es 'perfil_proveedor' o 'proveedores' dependiendo tu esquema.
        // Asumo 'perfil_proveedor' basado en tu archivo de solución.
        const { data, error } = await this.supabase
            .from('perfil_proveedor')
            .insert([profile])
            .select()
            .single();

        if (error) {
            console.error('Error creating provider profile:', error);
            // Si falla, no rompemos todo el flujo si el usuario ya se creó, 
            // pero idealmente deberíamos manejarlo.
            throw error;
        }
        return data;
    }

    // Crear perfil de cliente
    async createClientProfile(profile: any) {
        const { data, error } = await this.supabase
            .from('perfil_cliente')
            .insert([profile])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Obtener usuario actual y perfil
    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return null;

        // Intentar obtener perfil (esto dependerá de tu estructura de BD)
        // Por ahora retornamos el user de auth que contiene metadata
        return user;
    }

    // Cerrar sesión
    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }
}

import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private router = inject(Router);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // Obtener usuario actual de la sesión
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // Registro de usuario
  // Registro de usuario
  async signUp(email: string, password: string, metadata: any) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email y contraseña deben ser texto válido');
    }

    const { data, error } = await this.supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: metadata // nombre_negocio, rol, etc.
      }
    });

    if (error) throw error;
    return data;
  }

  // Inicio de sesión
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  // Cerrar sesión
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  // Crear perfil de proveedor en la tabla 'perfil_proveedor'
  async createProviderProfile(profile: any) {
    const { data, error } = await this.supabase
      .from('perfil_proveedor')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Crear perfil de cliente en la tabla 'perfil_cliente'
  async createClientProfile(profile: any) {
    const { data, error } = await this.supabase
      .from('perfil_cliente')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtener perfil del usuario (proveedor o cliente)
  async getUserProfile(userId: string, role: 'provider' | 'client') {
    const table = role === 'provider' ? 'perfil_proveedor' : 'perfil_cliente';
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('usuario_id', userId)
      .single();

    if (error) return null;
    return data;
  }
}

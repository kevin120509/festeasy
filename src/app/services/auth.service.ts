import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).getClient();
  private supabaseAuth = inject(SupabaseAuthService);
  private router = inject(Router);

  // Signals for state
  isLoggedIn = signal(false);
  currentUser = signal<any>(null);

  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        await this.loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  async waitForAuth(): Promise<boolean> {
    await this.initPromise;
    return this.isLoggedIn();
  }

  private async loadUserProfile(user: any) {
    // 1. Determine role from DB (source of truth)
    let rol = await this.supabaseAuth.determineUserRole(user.id);

    // 2. Fallback to metadata if DB check fails (e.g. new user not yet in profile table)
    if (!rol) {
      rol = user.user_metadata?.rol || 'client';
    }

    const table = rol === 'admin' ? 'perfil_admin' : (rol === 'provider' ? 'perfil_proveedor' : 'perfil_cliente');

    const { data: profile } = await this.supabase
      .from(table)
      .select('*')
      .eq('usuario_id', user.id)
      .single();

    const fullUser = {
      nombre_completo: profile?.nombre_completo ||
        user.user_metadata?.nombre ||
        user.user_metadata?.nombre_completo ||
        user.email?.split('@')[0] ||
        'Usuario',
      ...profile,
      profile_id: profile?.id ?? null,
      id: user.id,
      email: user.email,
      rol: rol,
    };

    this.isLoggedIn.set(true);
    this.currentUser.set(fullUser);
  }

  async refreshUserProfile() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      await this.loadUserProfile(user);
    }
  }

  // Legacy method used by Login component
  login(token: string, user: any): void {
    // Just update state, Supabase client already has session from the login call
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    localStorage.clear(); // Clear any remnants
    this.router.navigate(['/login']);
  }

  async loginWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  }

  getToken(): string | null {
    // Attempt to find the Supabase token in any of the potential keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
        try {
          const session = JSON.parse(localStorage.getItem(key)!);
          return session?.access_token || null;
        } catch (e) {
          console.error('Error parsing session from localStorage', e);
        }
      }
    }
    return null;
  }

  isClient(): boolean {
    return this.currentUser()?.rol === 'client';
  }

  isProvider(): boolean {
    return this.currentUser()?.rol === 'provider';
  }

  getUserRole(): string | null {
    return this.currentUser()?.rol || null;
  }

  getUserId(): string | null {
    return this.currentUser()?.id || null;
  }

  /**
   * Asegura que el usuario actual tenga un registro en perfil_cliente.
   * Útil para proveedores que quieren contratar servicios o usuarios nuevos.
   */
  async ensureClientProfile(): Promise<void> {
    const user = this.currentUser();
    console.log('🛡️ ensureClientProfile: Iniciando. User state:', !!user, user?.id);
    if (!user) {
      console.warn('🛡️ ensureClientProfile: No hay usuario en el signal.');
      return;
    }

    // Si ya tiene profile_id y es de cliente, ya estamos listos
    if (user.profile_id && user.rol === 'client') {
      console.log('🛡️ ensureClientProfile: Ya tiene perfil de cliente activo.');
      return;
    }

    console.log('🛡️ ensureClientProfile: Buscando perfil en DB para:', user.id);
    // Verificar si ya existe en la tabla perfil_cliente
    const { data: profile, error: fetchError } = await this.supabase
      .from('perfil_cliente')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('🛡️ ensureClientProfile: Error buscando perfil:', fetchError);
    }

    if (profile) {
      console.log('🛡️ ensureClientProfile: Perfil encontrado en DB, actualizando signal.');
      // Si existe pero no estaba en el signal, actualizar signal
      this.currentUser.update(curr => ({
        ...curr,
        profile_id: profile.id,
        ...profile
      }));
      return;
    }

    console.log('🛡️ ensureClientProfile: Perfil no existe. Creando uno nuevo...');
    // Si no existe, crearlo
    const { data: { user: authUser } } = await this.supabase.auth.getUser();
    const nombre = authUser?.user_metadata?.['nombre'] ||
      authUser?.user_metadata?.['nombre_completo'] ||
      authUser?.email?.split('@')[0] ||
      'Usuario';

    const { data: newProfile, error } = await this.supabase
      .from('perfil_cliente')
      .insert({
        usuario_id: user.id,
        nombre_completo: nombre,
      })
      .select()
      .single();

    if (error) {
      console.error('🛡️ ensureClientProfile: Error creando perfil fallback:', error);
      throw error;
    }

    if (newProfile) {
      console.log('🛡️ ensureClientProfile: Perfil creado exitosamente.');
      this.currentUser.update(curr => ({
        ...curr,
        profile_id: newProfile.id,
        ...newProfile
      }));
    }
  }
}

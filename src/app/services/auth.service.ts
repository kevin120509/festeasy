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

    const table = rol === 'provider' ? 'perfil_proveedor' : 'perfil_cliente';

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
    // Return token from current session if available
    // We can't synchronously get it easily from Supabase client without async getSession
    // But for HttpClient legacy support, we might need it.
    // However, since we migrated ApiService to use SupabaseClient directly, 
    // this might only be used by HttpClient methods (getProfile, etc.)
    // Let's try to get it from localStorage where Supabase saves it?
    // Supabase key is `sb-<url>-auth-token`
    // Or just return null and let ApiService handle it via client?
    // ApiService's getHeaders() calls this.
    // We'll rely on the localStorage key we used to use? 
    // No, we want to remove "festeasy_token".

    // Quick fix: Attempt to read from Supabase local storage entry if possible, 
    // or just return empty string as we are moving away from HTTP Client for core logic.
    return localStorage.getItem('sb-ghlosgnopdmrowiygxdm-auth-token')
      ? JSON.parse(localStorage.getItem('sb-ghlosgnopdmrowiygxdm-auth-token')!).access_token
      : null;
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

  /**
   * Asegura que el usuario actual tenga un registro en perfil_cliente.
   * Útil para proveedores que quieren contratar servicios o usuarios nuevos.
   */
  async ensureClientProfile(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    // Si ya tiene profile_id y es de cliente, ya estamos listos
    if (user.profile_id && user.rol === 'client') return;

    // Verificar si ya existe en la tabla perfil_cliente
    const { data: profile } = await this.supabase
      .from('perfil_cliente')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (profile) {
      // Si existe pero no estaba en el signal, actualizar signal
      this.currentUser.update(curr => ({
        ...curr,
        profile_id: profile.id,
        ...profile
      }));
      return;
    }

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
      console.error('Error creating fallback client profile:', error);
      throw error;
    }

    if (newProfile) {
      this.currentUser.update(curr => ({
        ...curr,
        profile_id: newProfile.id,
        ...newProfile
      }));
    }
  }
}

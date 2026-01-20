import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).getClient();
  private supabaseAuth = inject(SupabaseAuthService);
  
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
      ...profile,
      profile_id: profile?.id ?? null,
      id: user.id,
      email: user.email,
      rol: rol,
    };

    this.isLoggedIn.set(true);
    this.currentUser.set(fullUser);
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
}

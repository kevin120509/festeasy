import { Injectable, signal, inject, NgZone } from '@angular/core';
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
  private ngZone = inject(NgZone);

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
        this.redirectBasedOnRole();
      } else {
         // Si no hay sesión inmediata, revisamos si venimos de un redireccionamiento OAuth (con hash en la URL)
         // Supabase procesa el hash automáticamente, pero a veces tarda unos milisegundos más que el getSession inicial.
         // Si hay un token en la URL, el onAuthStateChange (SIGNED_IN) se encargará de atraparlo en breve.
         const hash = window.location.hash;
         if (hash && hash.includes('access_token')) {
             console.log('Detectado token OAuth en URL, esperando onAuthStateChange...');
             // No hacemos nada, dejamos que onAuthStateChange haga su trabajo
         }
      }
      
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.ngZone.run(async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            // This captures the flow when returning from an OAuth callback
            if (!this.currentUser()) {
               await this.loadUserProfile(session.user);
            }
            this.redirectBasedOnRole();
          } else if (event === 'SIGNED_OUT') {
             this.isLoggedIn.set(false);
             this.currentUser.set(null);
             localStorage.clear();
          }
        });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  async waitForAuth(): Promise<boolean> {
    await this.initPromise;
    return this.isLoggedIn();
  }

  private redirectBasedOnRole() {
    this.ngZone.run(() => {
      const role = this.currentUser()?.rol;
      const currentPath = window.location.pathname;
      const hasOAuthHash = window.location.hash && window.location.hash.includes('access_token');

      const navigateTo = (path: string) => {
          if (hasOAuthHash) {
              // Si venimos de Google OAuth, la URL tiene un hash gigante. 
              // Usamos location.replace para limpiar la URL y forzar la entrada limpia.
              window.location.replace(path);
          } else {
              this.router.navigate([path]);
          }
      };

      // Siempre forzar la selección si es pending
      if (role === 'pending' && currentPath !== '/seleccionar-rol') {
          navigateTo('/seleccionar-rol');
          return;
      }

      // Solo redirigir al dashboard si estamos en la landing page o en login (o retornando de OAuth)
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/registro' || hasOAuthHash) {
        if (role === 'admin') {
           navigateTo('/admin/dashboard');
        } else if (role === 'provider') {
           navigateTo('/proveedor/dashboard');
        } else if (role === 'client') {
           navigateTo('/cliente/dashboard');
        }
      }
    });
  }

  private async loadUserProfile(user: any) {
    // 1. Determine role from DB (source of truth)
    let rol: string | null = await this.supabaseAuth.determineUserRole(user.id);

    // 2. Fallback to metadata if DB check fails (e.g. new user not yet in profile table)
    if (!rol) {
      rol = user.user_metadata?.rol || 'pending';
    }

    let profile = null;
    
    // Solo buscar en DB si no es pending
    if (rol !== 'pending') {
      const table = rol === 'admin' ? 'perfil_admin' : (rol === 'provider' ? 'perfil_proveedor' : 'perfil_cliente');
      const { data } = await this.supabase
        .from(table)
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();
      profile = data;
    }

    const fullUser = {
      nombre_completo: profile?.nombre_completo ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
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

  async completeGoogleClientRegistration() {
    const user = this.currentUser();
    if (!user || user.rol !== 'pending') return;

    const authUserResponse = await this.supabase.auth.getUser();
    const authUser = authUserResponse.data.user;
    
    if (!authUser) throw new Error('Usuario autenticado no encontrado');

    const nombre = authUser.user_metadata?.['full_name'] || 
                   authUser.user_metadata?.['name'] || 
                   authUser.user_metadata?.['nombre'] ||
                   authUser.user_metadata?.['nombre_completo'] ||
                   authUser.email?.split('@')[0] || 
                   'Usuario';

    // 1. Crear el perfil de cliente
    const { data: profile, error } = await this.supabase
      .from('perfil_cliente')
      .insert({
        usuario_id: user.id,
        nombre_completo: nombre,
      })
      .select()
      .single();

    if (error) {
       console.error('Error al registrar al cliente de Google', error);
       throw error;
    }

    // 2. Actualizar el Auth metadata (Opcional, pero bueno)
    await this.supabase.auth.updateUser({
      data: { rol: 'client' }
    });

    // 3. Actualizar la señal del currentUser para que ya esté logueado como cliente
    this.currentUser.update(curr => ({
      ...curr,
      rol: 'client',
      profile_id: profile.id,
      ...profile
    }));
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
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account' // Forzar a que siempre pregunte qué cuenta usar
        }
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

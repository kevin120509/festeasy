import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';
import { SupabaseAuthService } from '../../services/supabase-auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent],
    templateUrl: './login.html'
})
export class LoginComponent {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService); // Mantenemos AuthService para estado global si es necesario
    private router = inject(Router);

    email = '';
    password = '';
    error = '';
    loading = false;

    async login() {
        if (!this.email || !this.password) {
            this.error = 'Por favor completa todos los campos';
            return;
        }

        this.loading = true;
        this.error = '';

<<<<<<< HEAD
        this.api.login(this.email, this.password).subscribe({
            next: (response) => {
                console.log('✅ Login response:', response);
                this.auth.login(response.token, response.user);

                // Navegar según el rol
                if (response.user.rol === 'provider') {
                    console.log('🔄 Redirigiendo a dashboard de proveedor...');
                    window.location.href = '/proveedor/dashboard';
=======
        try {
            const { session, user } = await this.supabaseAuth.signIn(this.email, this.password);

            if (user && session) {
                // Sincronizar con el AuthService legacy para que el resto de la app crea que estamos logueados
                // El backend legacy espera {token, user}, simulamos eso o guardamos lo de supabase

                // Extraer rol de metadata
                const rol = user.user_metadata['rol'] || 'client'; // Default a cliente si no hay rol

                // Guardamos sesión en AuthService (adaptándolo si es necesario)
                // AuthService espera (token, userObject). Pasamos el access_token y el user de supabase adaptado
                this.auth.login(session.access_token, {
                    id: user.id,
                    email: user.email,
                    rol: rol,
                    nombre: user.user_metadata['nombre_negocio'] || user.user_metadata['nombre'] || 'Usuario'
                });

                if (rol === 'provider') {
                    this.router.navigate(['/proveedor/dashboard']);
>>>>>>> 934db9194f24387cd7de91aab4f4a59d9a806e83
                } else {
                    console.log('🔄 Redirigiendo a dashboard de cliente...');
                    window.location.href = '/cliente/dashboard';
                }
<<<<<<< HEAD
            },
            error: (err) => {
                console.error('❌ Login error details:', err);
                this.error = err.error?.message || `Error al iniciar sesión (${err.status} - ${err.statusText})`;
                this.loading = false;
            },
            complete: () => {
                // Este callback se ejecuta siempre al final
                console.log('🔵 Login request completed');
=======
>>>>>>> 934db9194f24387cd7de91aab4f4a59d9a806e83
            }
        } catch (err: any) {
            console.error('Login error:', err);
            this.error = err.message || 'Error al iniciar sesión. Verifica tus credenciales.';
        } finally {
            this.loading = false;
        }
    }
}

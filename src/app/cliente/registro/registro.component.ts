import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseAuthService } from '../../services/supabase-auth.service';

@Component({
    selector: 'app-cliente-registro',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './registro.html'
})
export class ClienteRegistroComponent {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private router = inject(Router);

    nombre = '';
    email = '';
    telefono = '';
    password = '';
    error = '';
    loading = false;

    async register() {
        // 1. Sanitización estricta de datos
        const nombreClean = String(this.nombre || '').trim();
        const emailClean = String(this.email || '').trim().toLowerCase();
        const passwordClean = String(this.password || '').trim();
        const telefonoClean = String(this.telefono || '').trim();

        // 2. Validación local
        if (!nombreClean || !emailClean || !passwordClean) {
            this.error = 'Por favor completa todos los campos obligatorios';
            return;
        }

        if (passwordClean.length < 6) {
            this.error = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            console.log('Intentando registrar:', { email: emailClean, nombre: nombreClean }); // Debug

            // 3. Register User in Supabase Auth
            const { user, session } = await this.supabaseAuth.signUp(
                emailClean,
                passwordClean,
                {
                    nombre: nombreClean,
                    rol: 'client'
                }
            );

            if (!user) throw new Error('Error al crear usuario');

            // 2. Create Profile in DB
            await this.supabaseAuth.createClientProfile({
                usuario_id: user.id,
                nombre_completo: nombreClean,
                telefono: telefonoClean
            });

            // 3. Login
            if (session) {
                this.auth.login(session.access_token, {
                    id: user.id,
                    email: user.email!, // Email confirmado desde Supabase
                    rol: 'client',
                    nombre: nombreClean
                });
                this.router.navigate(['/cliente/dashboard']);
            } else {
                this.error = 'Registro exitoso. Por favor confirma tu correo.';
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            this.error = err.message || 'Error al registrarse';
        } finally {
            this.loading = false;
        }
    }
}

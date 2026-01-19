import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { SupabaseAuthService } from '../../services/supabase-auth.service';

@Component({
    selector: 'app-cliente-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent],
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
        if (!this.nombre || !this.email || !this.password) {
            this.error = 'Por favor completa todos los campos obligatorios';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            // 1. Register User in Supabase Auth
            const { user, session } = await this.supabaseAuth.signUp(
                this.email,
                this.password,
                {
                    nombre: this.nombre,
                    rol: 'client'
                }
            );

            if (!user) throw new Error('Error al crear usuario');

            // 2. Create Profile in DB
            await this.supabaseAuth.createClientProfile({
                usuario_id: user.id,
                nombre_completo: this.nombre,
                telefono: this.telefono
            });

            // 3. Login
            if (session) {
                this.auth.login(session.access_token, {
                    id: user.id,
                    email: user.email,
                    rol: 'client',
                    nombre: this.nombre
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

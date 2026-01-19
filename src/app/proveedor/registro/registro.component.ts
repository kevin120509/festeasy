import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { SupabaseAuthService } from '../../services/supabase-auth.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private router = inject(Router);

    nombreNegocio = '';
    categoria = '';
    ubicacion = '';
    email = '';
    password = '';
    error = '';
    loading = false;

    categorias = ['DJ / Sonido', 'Catering', 'Fotografía', 'Decoración', 'Iluminación', 'Pastelería', 'Mobiliario', 'Entretenimiento'];

    async register() {
        if (!this.nombreNegocio || !this.categoria || !this.email || !this.password) {
            this.error = 'Por favor completa todos los campos obligatorios';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            console.log('🔵 Registrando proveedor vía Supabase...', this.email);

            // 1. Registrar usuario en Supabase Auth
            const { user, session } = await this.supabaseAuth.signUp(
                this.email,
                this.password,
                {
                    nombre_negocio: this.nombreNegocio,
                    rol: 'provider'
                }
            );

            if (!user) throw new Error('No se pudo crear el usuario');

            console.log('✅ Usuario Auth creado:', user.id);

            // 2. Crear perfil de proveedor en la BD
            // Nota: Dependiendo de tu configuración de RLS (Row Level Security) en Supabase,
            // esto podría fallar si el usuario no tiene permisos inmediatos.
            // Si falla, el usuario ya existe en Auth, habría que manejar ese "estado intermedio".
            await this.supabaseAuth.createProviderProfile({
                usuario_id: user.id,
                nombre_negocio: this.nombreNegocio,
                descripcion: `Categoría: ${this.categoria}`,
                direccion_formato: this.ubicacion
            });

            console.log('✅ Perfil proveedor creado');

            // 3. Auto-Login en la app (AuthService)
            // Si el registro retorna sesión (usualmente sí, si no hay confirmación de email obligatoria)
            if (session) {
                this.auth.login(session.access_token, {
                    id: user.id,
                    email: user.email,
                    rol: 'provider',
                    nombre: this.nombreNegocio
                });
                this.router.navigate(['/proveedor/dashboard']);
            } else {
                this.error = 'Registro exitoso. Por favor revisa tu correo para confirmar tu cuenta antes de iniciar sesión.';
            }

        } catch (err: any) {
            console.error('❌ Error en el registro:', err);
            this.error = err.message || 'Error al registrarse';
        } finally {
            this.loading = false;
        }
    }

}

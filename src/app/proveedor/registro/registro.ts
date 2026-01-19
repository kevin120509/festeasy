import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent {
    private api = inject(ApiService);
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
            console.log('🔵 PASO 1: Registrando usuario en tabla users...');

            // PASO 1: Crear usuario en tabla users
            const userData = {
                correo_electronico: this.email,
                contrasena: this.password,
                rol: 'provider'  // Importante: marcar como proveedor
            };
            console.log('📤 Datos de usuario:', userData);

            const userResponse = await this.api.register(userData).toPromise();
            console.log('✅ Usuario creado:', userResponse);

            // Validar que recibimos el ID del usuario
            if (!userResponse?.user?.id) {
                throw new Error('No se recibió ID de usuario del servidor');
            }

            const userId = userResponse.user.id;
            console.log('🆔 ID de usuario obtenido:', userId);

            console.log('🔵 PASO 2: Creando perfil de proveedor...');

            // PASO 2: Crear perfil en tabla perfil_proveedor
            const profileData = {
                usuario_id: userId,  // Vincular con el usuario recién creado
                nombre_negocio: this.nombreNegocio,
                descripcion: `Categoría: ${this.categoria}`,
                direccion_formato: this.ubicacion || undefined,
                categoria_principal: this.categoria
            };
            console.log('📤 Datos de perfil:', profileData);

            const profileResponse = await this.api.createProviderProfile(profileData).toPromise();
            console.log('✅ Perfil de proveedor creado:', profileResponse);

            console.log('🔵 PASO 3: Iniciando sesión automáticamente...');

            // PASO 3: Login automático con las credenciales
            const loginResponse = await this.api.login(this.email, this.password).toPromise();
            console.log('✅ Login exitoso:', {
                token: loginResponse.token ? 'Token recibido' : 'No token',
                userId: loginResponse.user?.id,
                rol: loginResponse.user?.rol
            });

            // PASO 4: Guardar sesión
            this.auth.login(loginResponse.token, loginResponse.user);

            console.log('🎉 Registro completado exitosamente, redirigiendo...');
            // Forzar recarga completa para asegurar estado limpio
            window.location.href = '/proveedor/dashboard';

        } catch (err: any) {
            console.error('❌ Error en el registro de proveedor:', err);
            console.error('📋 Detalles completos del error:', {
                status: err.status,
                statusText: err.statusText,
                message: err.message,
                error: err.error,
                url: err.url
            });

            // Mensajes de error más específicos
            if (err.status === 404) {
                this.error = `Endpoint no encontrado (404): ${err.url}. Verifica que el backend esté corriendo.`;
            } else if (err.status === 500) {
                this.error = `Error del servidor: ${err.error?.error || err.error?.message || 'Error interno del servidor'}. Revisa la consola para más detalles.`;
            } else if (err.status === 401) {
                this.error = 'Credenciales inválidas. Por favor verifica tu email y contraseña.';
            } else if (err.status === 409) {
                this.error = 'Este email ya está registrado. Por favor usa otro email o inicia sesión.';
            } else if (err.status === 400) {
                this.error = `Datos inválidos: ${err.error?.error || err.error?.message || 'Verifica que todos los campos estén correctos'}`;
            } else {
                this.error = err.error?.message || err.error?.error || `Error al registrarse (${err.status} - ${err.statusText})`;
            }

            this.loading = false;
        }
    }

}

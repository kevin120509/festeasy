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
            console.log('🔵 Registrando proveedor independiente...');

            // 1. Registrar proveedor (TODO en un solo paso!)
            const registerData = {
                correo_electronico: this.email,
                contrasena: this.password,
                nombre_negocio: this.nombreNegocio,
                descripcion: `Categoría: ${this.categoria}`,
                direccion_formato: this.ubicacion || undefined
            };
            console.log('📤 Datos de registro:', registerData);

            const registerResponse = await this.api.registerProvider(registerData).toPromise();
            console.log('✅ Proveedor registrado:', registerResponse);

            console.log('🔵 Iniciando sesión automáticamente...');

            // 2. Login automático
            const loginResponse = await this.api.loginProvider(this.email, this.password).toPromise();
            console.log('✅ Login exitoso:', {
                token: loginResponse.token ? 'Token recibido' : 'No token',
                proveedorId: loginResponse.proveedor?.id,
                nombreNegocio: loginResponse.proveedor?.nombre_negocio
            });

            // 3. Guardar sesión
            this.auth.login(loginResponse.token, loginResponse.proveedor);

            console.log('🎉 Registro completado, redirigiendo al dashboard...');
            this.router.navigate(['/proveedor/dashboard']);

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
            if (err.status === 500) {
                this.error = `Error del servidor: ${err.error?.error || err.error?.message || 'Error interno del servidor'}. Revisa la consola para más detalles.`;
            } else if (err.status === 401) {
                this.error = 'Credenciales inválidas. Por favor verifica tu email y contraseña.';
            } else if (err.status === 409) {
                this.error = 'Este email ya está registrado. Por favor usa otro email o inicia sesión.';
            } else if (err.status === 400) {
                this.error = `Datos inválidos: ${err.error?.error || 'Verifica que todos los campos estén correctos'}`;
            } else {
                this.error = err.error?.message || err.error?.error || `Error al registrarse (${err.status} - ${err.statusText})`;
            }

            this.loading = false;
        }
    }

}

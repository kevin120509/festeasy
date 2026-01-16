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
            // 1. Register User
            await this.api.register({
                correo_electronico: this.email,
                contrasena: this.password,
                rol: 'provider'
            }).toPromise();

            // 2. Login to get token
            const loginResponse = await this.api.login(this.email, this.password).toPromise();
            this.auth.login(loginResponse.token, loginResponse.user);

            // 3. Create Profile
            // TODO: In a real app we need the UUID for the category.
            // For now sending the string in description or name for simplicity until backend supports category by name or we fetch IDs.
            await this.api.createProviderProfile({
                usuario_id: loginResponse.user.id,
                nombre_negocio: this.nombreNegocio,
                descripcion: `Categoría: ${this.categoria}`, // Temporary mapping
                direccion_formato: this.ubicacion,
                // categoria_principal_id: ??? Need to fetch categories first
            }).toPromise();

            this.router.navigate(['/proveedor/dashboard']);

        } catch (err: any) {
            console.error('Provider Registration error details:', err);
            this.error = err.error?.message || `Error al registrarse (${err.status} - ${err.statusText})`;
            this.loading = false;
        }
    }
}

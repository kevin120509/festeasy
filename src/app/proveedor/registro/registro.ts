import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent],
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

    register() {
        if (!this.nombreNegocio || !this.categoria || !this.email || !this.password) {
            this.error = 'Por favor completa todos los campos obligatorios';
            return;
        }

        this.loading = true;
        this.error = '';

        this.api.register({
            correo_electronico: this.email,
            contrasena: this.password,
            rol: 'provider',
            nombre_negocio: this.nombreNegocio
        }).subscribe({
            next: (response) => {
                this.auth.login(response.token, response.user);
                this.router.navigate(['/proveedor/dashboard']);
            },
            error: (err) => {
                this.error = err.error?.message || 'Error al registrarse';
                this.loading = false;
            }
        });
    }
}

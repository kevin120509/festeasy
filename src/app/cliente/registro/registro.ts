import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-cliente-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent],
    templateUrl: './registro.html'
})
export class ClienteRegistroComponent {
    private api = inject(ApiService);
    private auth = inject(AuthService);

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
            // 1. Register User
            await this.api.register({
                correo_electronico: this.email,
                contrasena: this.password,
                rol: 'client'
            }).toPromise();

            // 2. Login to get token  
            const loginResponse = await this.api.login(this.email, this.password).toPromise();

            // 3. Guardar sesión en localStorage
            this.auth.login(loginResponse.token, loginResponse.user);

            // 4. Create Profile
            await this.api.createClientProfile({
                usuario_id: loginResponse.user.id,
                nombre_completo: this.nombre,
                telefono: this.telefono
            }).toPromise();

            // 5. Forzar recarga completa con window.location.href
            // Esto asegura que Angular recarga completamente y los guards leen el estado correcto
            window.location.href = '/cliente/dashboard';

        } catch (err: any) {
            console.error('Registration error details:', err);
            this.error = err.error?.message || `Error al registrarse (${err.status} - ${err.statusText})`;
            this.loading = false;
        }
    }
}

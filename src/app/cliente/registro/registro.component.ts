import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
            // 1. Register User
            await this.api.register({
                correo_electronico: this.email,
                contrasena: this.password,
                rol: 'client'
            }).toPromise();

            // 2. Login to get token
            const loginResponse = await this.api.login(this.email, this.password).toPromise();
            this.auth.login(loginResponse.token, loginResponse.user);

            // 3. Create Profile
            await this.api.createClientProfile({
                usuario_id: loginResponse.user.id,
                nombre_completo: this.nombre,
                telefono: this.telefono // Assuming telefono is bound in the template
            }).toPromise();

            this.router.navigate(['/cliente/dashboard']);

        } catch (err: any) {
            console.error('Registration error details:', err);
            this.error = err.error?.message || `Error al registrarse (${err.status} - ${err.statusText})`;
            this.loading = false;
        }
    }
}

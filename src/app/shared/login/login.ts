import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent],
    templateUrl: './login.html'
})
export class LoginComponent {
    private api = inject(ApiService);
    private auth = inject(AuthService);
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

        this.api.login(this.email, this.password).subscribe({
            next: (response) => {
                console.log('✅ Login response:', response);
                this.auth.login(response.token, response.user);

                // Navegar según el rol
                if (response.user.rol === 'provider') {
                    console.log('🔄 Redirigiendo a dashboard de proveedor...');
                    window.location.href = '/proveedor/dashboard';
                } else {
                    console.log('🔄 Redirigiendo a dashboard de cliente...');
                    window.location.href = '/cliente/dashboard';
                }
            },
            error: (err) => {
                console.error('❌ Login error details:', err);
                this.error = err.error?.message || `Error al iniciar sesión (${err.status} - ${err.statusText})`;
                this.loading = false;
            },
            complete: () => {
                // Este callback se ejecuta siempre al final
                console.log('🔵 Login request completed');
            }
        });
    }
}

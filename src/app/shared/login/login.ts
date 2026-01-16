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
                this.auth.login(response.token, response.user);
                if (response.user.rol === 'provider') {
                    this.router.navigate(['/proveedor/dashboard']);
                } else {
                    this.router.navigate(['/cliente/dashboard']);
                }
            },
            error: (err) => {
                this.error = err.error?.message || 'Error al iniciar sesión';
                this.loading = false;
            }
        });
    }
}

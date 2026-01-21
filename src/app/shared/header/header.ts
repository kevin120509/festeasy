import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './header.html',
})
export class HeaderComponent {
    auth = inject(AuthService);
    router = inject(Router);

    // Verificar si estamos en una página de autenticación
    isAuthPage(): boolean {
        const url = this.router.url;
        return url.includes('/login') ||
            url.includes('/registro') ||
            url.includes('/cliente/registro') ||
            url.includes('/proveedor/registro');
    }

    logout() {
        this.auth.logout();
        window.location.href = '/';
    }
}

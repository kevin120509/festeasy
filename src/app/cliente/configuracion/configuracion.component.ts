import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-cliente-configuracion',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './configuracion.component.html'
})
export class ClienteConfiguracionComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    async cerrarSesion() {
        try {
            await this.auth.logout();
            // AuthService.logout already naviga a /login, pero por seguridad redirigimos
            this.router.navigate(['/login']);
        } catch (err) {
            console.error('Error cerrando sesión:', err);
            alert('No se pudo cerrar sesión. Intenta de nuevo.');
        }
    }
}

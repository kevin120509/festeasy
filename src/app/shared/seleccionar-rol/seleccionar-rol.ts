import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-seleccionar-rol',
  standalone: true,
  imports: [],
  templateUrl: './seleccionar-rol.html',
  styleUrls: ['./seleccionar-rol.css']
})
export class SeleccionarRolComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  async selectRole(role: 'client' | 'provider') {
    if (role === 'client') {
      try {
        await this.auth.completeGoogleClientRegistration();
        this.router.navigate(['/cliente/dashboard']);
      } catch (error) {
        console.error('Error completando registro de cliente:', error);
        alert('Hubo un error al crear tu perfil de cliente.');
      }
    } else if (role === 'provider') {
      // Redirigir al formulario de registro de proveedor para completar datos
      this.router.navigate(['/proveedor/registro']);
    }
  }
}

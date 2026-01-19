import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private router = inject(Router);

    nombreNegocio = '';
    categoria = '';
    ubicacion = '';
    email = '';
    password = '';
    error = '';
    loading = false;
    
    // Lista de categorías disponibles
    categorias = [
        'DJ / Sonido',
        'Catering',
        'Fotografía',
        'Decoración',
        'Iluminación',
        'Pastelería',
        'Salones',
        'Animación',
        'Transporte'
    ];

    async register() {
        if (!this.nombreNegocio || !this.email || !this.password) {
            this.error = 'Completa los campos obligatorios';
            return;
        }
        this.loading = true;
        try {
            const { user, session } = await this.supabaseAuth.signUp(this.email, this.password, { nombre_negocio: this.nombreNegocio, rol: 'provider' });
            if (!session) {
                alert('Registro exitoso. Revisa tu correo.');
                this.router.navigate(['/login']);
                return;
            }
            await this.supabaseAuth.createProviderProfile({ usuario_id: user?.id, nombre_negocio: this.nombreNegocio });
            alert('¡Cuenta creada!');
            this.router.navigate(['/login']);
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            this.loading = false;
        }
    }
}
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent implements OnInit {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private api = inject(ApiService);
    private router = inject(Router);

    nombreNegocio = '';
    categoriaId = '';
    ubicacion = '';
    email = '';
    password = '';
    error = '';
    loading = false;
    
    // Categorías desde DB
    categorias = signal<any[]>([]);

    ngOnInit() {
        this.api.getServiceCategories().subscribe({
            next: (cats) => this.categorias.set(cats),
            error: (err) => console.error('Error cargando categorías', err)
        });
    }

    async register() {
        if (!this.nombreNegocio || !this.email || !this.password || !this.categoriaId) {
            this.error = 'Completa los campos obligatorios';
            return;
        }
        this.loading = true;
        try {
            const { user, session } = await this.supabaseAuth.signUp(this.email, this.password, { 
                nombre_negocio: this.nombreNegocio, 
                rol: 'provider' 
            });
            
            if (!session) {
                alert('Registro exitoso. Revisa tu correo.');
                this.router.navigate(['/login']);
                return;
            }

            // Crear perfil con categoría y ubicación
            await this.supabaseAuth.createProviderProfile({ 
                usuario_id: user?.id, 
                nombre_negocio: this.nombreNegocio,
                categoria_principal_id: this.categoriaId,
                direccion_formato: this.ubicacion || 'Ciudad de México'
            });

            alert('¡Cuenta creada! Por favor inicia sesión.');
            this.router.navigate(['/login']);
        } catch (err: any) {
            console.error(err);
            this.error = 'Error en registro: ' + (err.message || 'Intenta de nuevo');
        } finally {
            this.loading = false;
        }
    }
}
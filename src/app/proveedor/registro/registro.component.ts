import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
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
    latitud = '';
    longitud = '';
    email = '';
    password = '';
    error = '';
    loading = false;
    detectingLocation = false;
    
    // Categorías desde DB
    categorias = signal<any[]>([]);

    ngOnInit() {
        this.api.getServiceCategories().subscribe({
            next: (cats) => this.categorias.set(cats),
            error: (err) => console.error('Error cargando categorías', err)
        });
    }

    async detectLocation() {
        if (!navigator.geolocation) {
            this.error = 'La geolocalización no está soportada por este navegador';
            return;
        }

        this.detectingLocation = true;
        this.error = '';

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                });
            });

            this.latitud = position.coords.latitude.toString();
            this.longitud = position.coords.longitude.toString();
            
            // Intentar obtener dirección aproximada usando un servicio de geocoding
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${this.latitud}&longitude=${this.longitud}&localityLanguage=es`);
                const data = await response.json();
                if (data.city && data.countryName) {
                    this.ubicacion = `${data.city}, ${data.countryName} (${this.latitud}, ${this.longitud})`;
                } else {
                    this.ubicacion = `${this.latitud}, ${this.longitud}`;
                }
            } catch (geocodeError) {
                console.warn('No se pudo obtener la dirección aproximada:', geocodeError);
                this.ubicacion = `${this.latitud}, ${this.longitud}`;
            }
            
        } catch (error: any) {
            console.error('Error obteniendo ubicación:', error);
            if (error.code === 1) {
                this.error = 'Acceso a ubicación denegado. Por favor permite el acceso a tu ubicación.';
            } else if (error.code === 2) {
                this.error = 'No se pudo determinar tu ubicación. Verifica tu conexión a internet.';
            } else if (error.code === 3) {
                this.error = 'Tiempo de espera agotado al obtener tu ubicación.';
            } else {
                this.error = 'Error al obtener tu ubicación. Inténtalo de nuevo.';
            }
        } finally {
            this.detectingLocation = false;
        }
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
                direccion_formato: this.ubicacion || 'Ciudad de México',
                latitud: this.latitud ? parseFloat(this.latitud) : null,
                longitud: this.longitud ? parseFloat(this.longitud) : null
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
import { Component, inject, OnInit, signal, NgZone } from '@angular/core';
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
    private ngZone = inject(NgZone);

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
            
            // Usar Nominatim (OpenStreetMap) para obtener colonia/barrio
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.latitud}&lon=${this.longitud}&zoom=18&addressdetails=1`);
                const data = await response.json();
                
                this.ngZone.run(() => {
                    if (data && data.address) {
                        const addr = data.address;
                        // Construir dirección detallada: Calle, Colonia, Ciudad, Estado
                        const parts = [];
                        if (addr.road) parts.push(addr.road);
                        if (addr.neighbourhood) parts.push(addr.neighbourhood);
                        else if (addr.suburb) parts.push(addr.suburb);
                        else if (addr.residential) parts.push(addr.residential);
                        
                        if (addr.city) parts.push(addr.city);
                        else if (addr.town) parts.push(addr.town);
                        else if (addr.village) parts.push(addr.village);
                        
                        if (addr.state) parts.push(addr.state);
                        // if (addr.country) parts.push(addr.country);

                        this.ubicacion = parts.join(', ');
                        
                        // Si falló algo en la construcción, usar display_name recortado
                        if (!this.ubicacion && data.display_name) {
                            this.ubicacion = data.display_name.split(',').slice(0, 3).join(',');
                        }
                    } else {
                        this.ubicacion = 'Ubicación detectada';
                    }
                    this.detectingLocation = false;
                });

            } catch (geocodeError) {
                console.warn('No se pudo obtener la dirección detallada:', geocodeError);
                this.ngZone.run(() => {
                    this.ubicacion = 'Ubicación detectada (coordenadas guardadas)';
                    this.detectingLocation = false;
                });
            }
            
        } catch (error: any) {
            this.ngZone.run(() => {
                console.error('Error obteniendo ubicación:', error);
                if (error.code === 1) {
                    this.error = 'Acceso a ubicación denegado. Por favor permite el acceso a tu ubicación.';
                } else if (error.code === 2) {
                    this.error = 'No se pudo determinar tu ubicación. Verifica tu conexión a internet y el GPS.';
                } else if (error.code === 3) {
                    this.error = 'Tiempo de espera agotado al obtener tu ubicación.';
                } else {
                    this.error = 'Error al obtener tu ubicación. Inténtalo de nuevo.';
                }
                this.detectingLocation = false;
            });
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
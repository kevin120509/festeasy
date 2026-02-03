import { Component, inject, OnInit, signal, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { PLAN_INFO, SUBSCRIPTION_LIMITS } from '../../services/subscription.service';
import { environment } from '../../../environments/environment';
import { OnDestroy } from '@angular/core';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent implements OnInit, OnDestroy {
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
    isPaying = signal(false);
    paypalBlocked = signal(false);

    // Multi-step registration
    step = signal(1); // 1: Datos, 2: Planes
    selectedPlan = signal<string | null>(null);
    planes = signal(PLAN_INFO);

    // State between steps
    registeredUserId: string | null = null;
    authSession: any = null;

    // Categorías desde DB
    categorias = signal<any[]>([]);

    ngOnInit() {
        this.api.getServiceCategories().subscribe({
            next: (cats) => this.categorias.set(cats),
            error: (err) => console.error('Error cargando categorías', err)
        });
    }

    ngOnDestroy() {
        const container = document.getElementById('paypal-button-container');
        if (container) container.innerHTML = '';
        const script = document.getElementById('paypal-sdk');
        if (script) script.remove();
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

    async nextStep() {
        if (!this.nombreNegocio || !this.email || !this.password || !this.categoriaId) {
            this.error = 'Completa los campos obligatorios';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            // PASO 1: Intentar registro en Supabase Auth
            // Esto valida el correo y crea la cuenta (o detecta si ya existe)
            const { user, session } = await this.supabaseAuth.signUp(this.email, this.password, {
                nombre_negocio: this.nombreNegocio,
                rol: 'provider'
            });

            this.registeredUserId = user?.id || null;
            this.authSession = session;

            // Si llegamos aquí, el usuario es válido
            this.step.set(2);
        } catch (err: any) {
            console.error('Error en pre-registro:', err);
            if (err.message?.includes('already registered')) {
                this.error = 'Este correo ya está registrado. Por favor inicia sesión.';
            } else {
                this.error = err.message || 'Error al validar tus datos. Intenta de nuevo.';
            }
        } finally {
            this.loading = false;
        }
    }

    prevStep() {
        this.step.set(1);
        this.error = '';
        this.selectedPlan.set(null);
    }

    selectPlan(planId: string) {
        this.selectedPlan.set(planId);

        if (planId === 'basico') {
            this.register();
        } else {
            // Iniciar flujo de PayPal para Pro o Premium
            this.initPaypal();
        }
    }

    async initPaypal() {
        try {
            this.error = '';
            await this.loadPaypalScript();
            setTimeout(() => {
                this.renderPaypalButton();
            }, 500);
        } catch (error) {
            console.error('Error initializing PayPal:', error);
            this.paypalBlocked.set(true);
            this.error = 'No se pudo cargar el procesador de pagos. Verifica tu conexión.';
        }
    }

    private loadPaypalScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (document.getElementById('paypal-sdk')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.id = 'paypal-sdk';
            script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=MXN&locale=es_MX&buyer-country=MX`;
            script.onload = () => resolve();
            script.onerror = (err) => {
                this.paypalBlocked.set(true);
                reject(err);
            };
            document.body.appendChild(script);
        });
    }

    private renderPaypalButton() {
        const container = document.getElementById('paypal-button-container');
        if (!container) return;
        container.innerHTML = '';

        const planId = this.selectedPlan();
        if (!planId) return;

        const limits = SUBSCRIPTION_LIMITS[planId as keyof typeof SUBSCRIPTION_LIMITS];
        const amount = limits.precio.toString();

        (window as any).paypal.Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
            createOrder: (data: any, actions: any) => {
                return actions.order.create({
                    purchase_units: [{
                        description: `Registro FestEasy - Plan ${limits.nombre}`,
                        amount: { value: amount }
                    }]
                });
            },
            onApprove: async (data: any, actions: any) => {
                try {
                    this.isPaying.set(true);
                    await actions.order.capture();
                    // Pago exitoso, proceder con el registro
                    this.register();
                } catch (error) {
                    console.error('Error processing payment:', error);
                    this.error = 'Error al procesar el pago.';
                } finally {
                    this.isPaying.set(false);
                }
            },
            onError: (err: any) => {
                console.error('PayPal error:', err);
                this.error = 'Ocurrió un error con PayPal.';
            }
        }).render('#paypal-button-container');
    }

    async register() {
        // En este nuevo flujo, 'register' se encarga de crear el PERFIL una vez que el usuario ya existe
        // y (si aplica) ya pagó.
        if (!this.registeredUserId) {
            this.error = 'Error de sesión. Por favor regresa al paso anterior.';
            return;
        }

        this.loading = true;
        try {
            // Crear perfil con categoría, ubicación y PLAN SELECCIONADO
            await this.supabaseAuth.createProviderProfile({
                usuario_id: this.registeredUserId,
                nombre_negocio: this.nombreNegocio,
                categoria_principal_id: this.categoriaId,
                direccion_formato: this.ubicacion || 'Ciudad de México',
                latitud: this.latitud ? parseFloat(this.latitud) : null,
                longitud: this.longitud ? parseFloat(this.longitud) : null,
                tipo_suscripcion_actual: this.selectedPlan() || 'basico'
            });

            if (!this.authSession) {
                alert('¡Casi listo! Revisa tu correo para confirmar tu cuenta e iniciar sesión.');
                this.router.navigate(['/login']);
            } else {
                alert('¡Registro completado con éxito!');
                this.router.navigate(['/proveedor/dashboard']);
            }

        } catch (err: any) {
            console.error('Error al crear perfil:', err);
            this.error = 'No pudimos crear tu perfil comercial: ' + (err.message || 'Intenta de nuevo');
        } finally {
            this.loading = false;
        }
    }
}
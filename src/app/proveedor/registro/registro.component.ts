import { Component, inject, OnInit, signal, NgZone, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SubscriptionService } from '../../services/subscription.service';
import { environment } from '../../../environments/environment';
import { OnDestroy } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-proveedor-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule, CheckboxModule],
    templateUrl: './registro.html'
})
export class ProveedorRegistroComponent implements OnInit, OnDestroy, AfterViewInit {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private api = inject(ApiService);
    private subscriptionService = inject(SubscriptionService);
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
    captchaResolved = signal(false);
    aceptarTerminos = signal(false);
    aceptarPrivacidad = signal(false);

    constructor() {
        (window as any).onCaptchaResolved = (token: string) => {
            this.ngZone.run(() => {
                this.captchaResolved.set(!!token);
            });
        };
    }

    ngAfterViewInit() {
        this.renderCaptcha();
    }

    renderCaptcha() {
        const checkGrecaptcha = () => {
            if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
                try {
                    (window as any).grecaptcha.render('recaptcha-proveedor', {
                        'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
                        'callback': 'onCaptchaResolved'
                    });
                } catch (e) {
                    console.warn('reCAPTCHA Proveedor already rendered or element missing', e);
                }
            } else {
                setTimeout(checkGrecaptcha, 500);
            }
        };
        checkGrecaptcha();
    }

    // Multi-step registration
    step = signal(1); // 1: Datos, 2: Planes
    selectedPlan = signal<string | null>('festeasy');
    selectedAddons = signal<string[]>([]);
    planes = this.subscriptionService.planInfo;
    addons = this.subscriptionService.addonsInfo;

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

        // Verificar si ya hay una sesión (el usuario ya existe en Auth) pero sin perfil
        this.checkExistingUser();
    }

    private async checkExistingUser() {
        const user = await this.supabaseAuth.getCurrentUser();
        if (user) {
            console.log('👤 Usuario detectado en registro:', user.email);
            // Si el rol es proveedor, ver si ya tiene perfil
            const profile = await this.supabaseAuth.getUserProfile(user.id, 'provider');
            if (!profile) {
                console.log('🚀 Usuario pre-autenticado sin perfil de proveedor. Completando datos del Paso 1.');
                this.registeredUserId = user.id;
                this.email = user.email || '';
                this.nombreNegocio = user.user_metadata?.['nombre_negocio'] || user.user_metadata?.['full_name'] || '';
                // No pasamos al paso 2, nos quedamos en el paso 1 para que llene Categoría y Ubicación.
                this.step.set(1);
            } else {
                console.log('✅ Perfil ya existe, redirigiendo a dashboard');
                this.router.navigate(['/proveedor/dashboard']);
            }
        }
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
                    this.error = 'No se pudo determinar tu ubicación. Verifica tu conexión a internet und el GPS.';
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
        this.selectedAddons.set([]);
    }

    selectPlan(planId: string) {
        this.selectedPlan.set(planId);
        // Ahora no registramos automáticamente, permitimos elegir addons
        // Solo para planes de pago mostramos el botón de PayPal más tarde
        if (planId === 'libre' || planId === 'basico') {
            this.selectedAddons.set([]); // Limpiar addons si elige el libre?
        }
    }

    toggleAddon(addonId: string) {
        this.selectedAddons.update(addons =>
            addons.includes(addonId)
                ? addons.filter(id => id !== addonId)
                : [...addons, addonId]
        );
    }

    getTotalPrice(): number {
        const basePrice = 499; // Precio fijo del plan FestEasy Plus
        const addonsPrice = this.addons()
            .filter(a => this.selectedAddons().includes(a.id))
            .reduce((sum, a) => sum + a.precio, 0);

        return basePrice + addonsPrice;
    }

    hasSelectedAnyPayment(): boolean {
        return this.getTotalPrice() > 0;
    }

    // Getter para obtener el nombre del plan seleccionado de forma legible
    getSelectedPlanName() {
        const planId = this.selectedPlan();
        if (!planId) return '';
        return this.planes().find((p: any) => p.id === planId)?.nombre || planId;
    }

    // Getter para color del plan
    getPlanColor() {
        const planId = this.selectedPlan();
        if (planId === 'premium') return 'primary';
        if (planId === 'pro') return 'amber';
        return 'slate';
    }

    async initPaypal() {
        try {
            this.error = '';
            // Limpiar contenedor previo por si acaso
            const container = document.getElementById('paypal-button-container');
            if (container) container.innerHTML = '';

            await this.loadPaypalScript();
            setTimeout(() => {
                this.renderPaypalButton();
            }, 100);
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

        const amount = this.getTotalPrice().toString();
        const description = `Registro FestEasy - Membresía FestEasy Plus` +
            (this.selectedAddons().length > 0 ? ` + ${this.selectedAddons().length} Complementos` : '');

        (window as any).paypal.Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
            createOrder: (data: any, actions: any) => {
                return actions.order.create({
                    purchase_units: [{
                        description: description,
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
                tipo_suscripcion_actual: this.selectedPlan() === 'basico' ? 'libre' : (this.selectedPlan() || 'libre'),
                addons: this.selectedAddons()
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
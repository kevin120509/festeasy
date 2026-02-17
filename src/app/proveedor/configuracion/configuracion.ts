import { Component, signal, inject, OnInit, OnDestroy, AfterViewInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';
import { SubscriptionService } from '../../services/subscription.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderProfile } from '../../models';

declare var paypal: any;
declare var Stripe: any;

@Component({
    selector: 'app-proveedor-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule, ConfirmDialogModule, ToastModule],
    templateUrl: './configuracion.html',
    styleUrl: './configuracion.css'
})
export class ProveedorConfiguracionComponent implements OnInit, OnDestroy, AfterViewInit {
    auth = inject(AuthService);
    api = inject(ApiService);
    supabase = inject(SupabaseService);
    supabaseData = inject(SupabaseDataService);
    subscriptionService = inject(SubscriptionService);
    router = inject(Router);
    confirmationService = inject(ConfirmationService);
    messageService = inject(MessageService);

    profile = signal<ProviderProfile | null>(null);
    loading = signal(false);
    saving = signal(false);
    uploadingAvatar = signal(false);
    detectingLocation = signal(false);
    upgradingPlan = signal(false);
    successMessage = signal('');
    errorMessage = signal('');
    paypalBlocked = signal(false);
    stripe: any;
    cardElement: any;
    metodoSuscripcion = signal<'paypal' | 'stripe'>('paypal');

    // Add-on states
    selectedAddons = signal<string[]>([]);

    totalSuscripcion = computed(() => {
        const basePrice = 499; // Precio fijo del plan Plus
        const addonsPrice = this.subscriptionService.addonsInfo()
            .filter((a: any) => this.selectedAddons().includes(a.id))
            .reduce((sum: number, a: any) => sum + a.precio, 0);
        return basePrice + addonsPrice;
    });

    // Form data
    formData = signal({
        nombre_negocio: '',
        descripcion: '',
        telefono: '',
        correo_contacto: '', // Nuevo campo
        ubicacion: '',
        latitud: 0,
        longitud: 0,
        radio_cobertura_km: 10,
        avatar_url: '',
        // Datos bancarios
        banco: '',
        titular: '',
        clabe: ''
    });

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.loading.set(true);
        const userId = this.auth.currentUser()?.id;

        if (!userId) {
            this.errorMessage.set('No se pudo obtener el usuario actual');
            this.loading.set(false);
            return;
        }

        // Buscar el perfil del proveedor por id o usuario_id
        this.api.getProviderProfile(userId).subscribe({
            next: (profile) => {
                this.profile.set(profile);
                const rawUbicacion = profile.direccion_formato || '';
                // Limpiar coordenadas repetidas si existen en la cadena guardada
                const cleanUbicacion = rawUbicacion.split(' (')[0].trim();

                // Formatear para mostrar una sola vez las coordenadas actuales
                const ubicacionDisplay = profile.latitud && profile.longitud
                    ? `${cleanUbicacion} (${profile.latitud}, ${profile.longitud})`
                    : cleanUbicacion;

                const bankData = profile.datos_bancarios_json || {};
                this.formData.set({
                    nombre_negocio: profile.nombre_negocio || '',
                    descripcion: profile.descripcion || '',
                    telefono: profile.telefono || '',
                    correo_contacto: bankData.email_contacto_publico || bankData.correo_contacto || profile.correo_electronico || '',
                    ubicacion: ubicacionDisplay,
                    latitud: profile.latitud || 0,
                    longitud: profile.longitud || 0,
                    radio_cobertura_km: profile.radio_cobertura_km || 10,
                    avatar_url: profile.avatar_url || '',
                    banco: bankData.banco || '',
                    titular: bankData.titular || '',
                    clabe: bankData.clabe || ''
                });
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile', err);
                this.errorMessage.set('Perfil no encontrado. Contacte al administrador.');
                this.loading.set(false);
            }
        });
    }

    async onAvatarChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            return;
        }

        const file = input.files[0];
        const userId = this.auth.currentUser()?.id;

        if (!userId) {
            this.errorMessage.set('No se pudo obtener el usuario actual');
            return;
        }

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            this.errorMessage.set('Por favor selecciona una imagen válida');
            return;
        }

        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.errorMessage.set('La imagen no debe superar los 2MB');
            return;
        }

        this.uploadingAvatar.set(true);
        this.errorMessage.set('');

        try {
            // Generar nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Subir archivo a Supabase Storage
            const publicUrl = await this.supabase.uploadFile('festeasy', filePath, file);

            // Actualizar el formData con la nueva URL
            this.formData.update(data => ({
                ...data,
                avatar_url: publicUrl
            }));

            this.successMessage.set('Imagen subida exitosamente');
            setTimeout(() => this.successMessage.set(''), 3000);
        } catch (error) {
            console.error('Error uploading avatar', error);
            this.errorMessage.set('Error al subir la imagen. Por favor intenta de nuevo.');
        } finally {
            this.uploadingAvatar.set(false);
        }
    }

    saveProfile() {
        if (!this.profile()) {
            this.errorMessage.set('Perfil no encontrado. Contacte al administrador.');
            return;
        }

        const userId = this.auth.currentUser()?.id;
        if (!userId) {
            this.errorMessage.set('No se pudo obtener el usuario actual');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const formData = this.formData();

        // Validaciones Manuales
        if (formData.telefono && (formData.telefono.length < 10 || formData.telefono.length > 12)) {
            this.errorMessage.set('El teléfono debe tener entre 10 y 12 dígitos');
            this.saving.set(false);
            return;
        }
        const data = {
            nombre_negocio: formData.nombre_negocio,
            descripcion: formData.descripcion,
            telefono: formData.telefono,
            direccion_formato: formData.ubicacion,
            latitud: formData.latitud,
            longitud: formData.longitud,
            radio_cobertura_km: formData.radio_cobertura_km,
            avatar_url: formData.avatar_url,
            // Guardamos el correo de contacto y datos bancarios en el JSON para evitar conflictos de schema
            datos_bancarios_json: {
                banco: formData.banco,
                titular: formData.titular,
                clabe: formData.clabe,
                email_contacto_publico: formData.correo_contacto // Usamos un nombre más explícito para el JSON
            }
        };
        this.api.updateProviderProfile(this.profile()!.id, data).subscribe({
            next: async (updatedProfile) => {
                this.profile.set(updatedProfile);
                await this.auth.refreshUserProfile();
                this.successMessage.set('Perfil actualizado exitosamente');
                this.saving.set(false);
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                console.error('Error updating profile', err);
                this.errorMessage.set('Error al actualizar el perfil');
                this.saving.set(false);
            }
        });
    }

    async detectLocation() {
        if (!navigator.geolocation) {
            this.errorMessage.set('La geolocalización no está soportada por este navegador');
            return;
        }

        this.detectingLocation.set(true);
        this.errorMessage.set('');

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                });
            });

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Intentar obtener dirección aproximada usando un servicio de geocoding
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
                const geoData: any = await response.json();
                if (geoData.city && geoData.countryName) {
                    this.formData.update(data => ({
                        ...data,
                        ubicacion: `${geoData.city}, ${geoData.countryName} (${lat}, ${lng})`,
                        latitud: lat,
                        longitud: lng
                    }));
                } else {
                    this.formData.update(data => ({
                        ...data,
                        ubicacion: `${lat}, ${lng}`,
                        latitud: lat,
                        longitud: lng
                    }));
                }
            } catch (geocodeError) {
                console.warn('No se pudo obtener la dirección aproximada:', geocodeError);
                this.formData.update(data => ({
                    ...data,
                    ubicacion: `${lat}, ${lng}`,
                    latitud: lat,
                    longitud: lng
                }));
            }

        } catch (error: any) {
            console.error('Error obteniendo ubicación:', error);
            if (error.code === 1) {
                this.errorMessage.set('Acceso a ubicación denegado. Por favor permite el acceso a tu ubicación.');
            } else if (error.code === 2) {
                this.errorMessage.set('No se pudo determinar tu ubicación. Verifica tu conexión a internet.');
            } else if (error.code === 3) {
                this.errorMessage.set('Tiempo de espera agotado al obtener tu ubicación.');
            } else {
                this.errorMessage.set('Error al obtener tu ubicación. Inténtalo de nuevo.');
            }
        } finally {
            this.detectingLocation.set(false);
        }
    }

    async logout() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres cerrar tu sesión?',
            header: 'Cerrar Sesión',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancelar',
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'secondary',
                outlined: true
            },
            acceptLabel: 'Sí, Salir',
            acceptButtonProps: {
                label: 'Sí, Salir',
                severity: 'danger'
            },
            accept: async () => {
                try {
                    await this.auth.logout();
                    this.router.navigate(['/login']);
                } catch (error) {
                    console.error('Error during logout:', error);
                    this.errorMessage.set('Error al cerrar sesión');
                }
            }
        });
    }

    async updateField(field: string, value: any) {
        this.formData.update(data => ({
            ...data,
            [field]: value
        }));
    }

    // ==========================================
    // PayPal Integration
    // ==========================================

    ngAfterViewInit() {
        this.initStripe();
        // Intentar renderizar botón si el plan es libre
        if (this.subscriptionService.currentPlan() === 'libre') {
            this.seleccionarMetodoSuscripcion('paypal');
        }
    }

    initStripe() {
        this.stripe = Stripe(environment.stripePublishableKey);
    }

    seleccionarMetodoSuscripcion(metodo: 'paypal' | 'stripe') {
        this.metodoSuscripcion.set(metodo);
        if (metodo === 'paypal') {
            this.initPaypal();
        } else {
            setTimeout(() => this.renderStripeElements(), 100);
        }
    }

    toggleAddon(addonId: string) {
        this.selectedAddons.update(list =>
            list.includes(addonId)
                ? list.filter(id => id !== addonId)
                : [...list, addonId]
        );
        // Reiniciar botones por si cambia el monto
        if (this.metodoSuscripcion() === 'paypal') {
            this.initPaypal();
        }
    }

    renderStripeElements() {
        const container = document.getElementById('stripe-card-element');
        if (!container) return;

        const elements = this.stripe.elements();
        this.cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a',
                },
            },
        });
        this.cardElement.mount('#stripe-card-element');
    }

    async pagarSuscripcionStripe() {
        if (this.upgradingPlan()) return;
        this.upgradingPlan.set(true);

        try {
            console.log('💳 Procesando suscripción con Stripe (Simulado)...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const userId = this.auth.currentUser()?.id;
            if (userId) {
                const targetPlan = 'festeasy';
                const amount = this.totalSuscripcion();

                await this.supabaseData.upgradeProviderSubscription(userId, targetPlan, amount);
                await this.auth.refreshUserProfile();
                await this.loadProfile();

                this.successMessage.set(`¡Bienvenido al Plan FestEasy! 🌟 Disfruta de todos tus complementos.`);
                setTimeout(() => this.successMessage.set(''), 5000);
            }
        } catch (error) {
            console.error('Error con Stripe Sub:', error);
            this.errorMessage.set('Error al procesar el pago con tarjeta.');
        } finally {
            this.upgradingPlan.set(false);
        }
    }

    ngOnDestroy() {
        const container = document.getElementById('paypal-button-container');
        if (container) {
            container.innerHTML = '';
        }
        // Limpieza estricta del script del DOM
        const script = document.getElementById('paypal-sdk');
        if (script) {
            script.remove();
        }
    }

    async initPaypal() {
        try {
            await this.loadPaypalScript();
            // Retraso para asegurar que el contenedor esté renderizado
            setTimeout(() => {
                this.renderPaypalButton();
            }, 1000);
        } catch (error) {
            console.error('Error initializing PayPal:', error);
            this.paypalBlocked.set(true);
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
                console.error('PayPal SDK Load Error:', err);
                this.paypalBlocked.set(true);
                reject(err);
            };
            document.body.appendChild(script);
        });
    }

    private renderPaypalButton() {
        const container = document.getElementById('paypal-button-container');
        if (!container) return; // Si no existe el contenedor, no hacer nada

        // Limpiar contenedor por si acaso
        container.innerHTML = '';

        (window as any).paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'pay'
            },
            createOrder: (data: any, actions: any) => {
                const planId = 'festeasy-plus';
                const amount = this.totalSuscripcion().toString();
                const addonsNames = this.subscriptionService.addonsInfo()
                    .filter((a: any) => this.selectedAddons().includes(a.id))
                    .map((a: any) => a.nombre).join(', ');

                return actions.order.create({
                    purchase_units: [{
                        description: `Suscripción FestEasy Plus ${addonsNames ? '+ ' + addonsNames : ''}`,
                        amount: {
                            value: amount
                        }
                    }]
                });
            },
            onApprove: async (data: any, actions: any) => {
                try {
                    const order = await actions.order.capture();
                    console.log('Pago exitoso:', order);

                    const userId = this.auth.currentUser()?.id;
                    if (userId) {
                        this.upgradingPlan.set(true);

                        const targetPlan = 'festeasy';
                        const amount = this.totalSuscripcion();

                        // Llamar al servicio que actualiza DB y crea historial
                        await this.supabaseData.upgradeProviderSubscription(userId, targetPlan, amount);

                        // Refrescar estado en la app
                        await this.auth.refreshUserProfile();
                        await this.loadProfile();

                        this.successMessage.set(`¡Bienvenido al Plan FestEasy Plus! 🌟 Disfruta de tus beneficios y complementos.`);

                        // Limpiar mensaje después de un tiempo
                        setTimeout(() => this.successMessage.set(''), 5000);
                    }
                } catch (error) {
                    console.error('Error processing payment approval:', error);
                    this.errorMessage.set('Error al procesar la actualización del plan.');
                } finally {
                    this.upgradingPlan.set(false);
                }
            },
            onError: (err: any) => {
                console.error('PayPal error:', err);
                this.errorMessage.set('Ocurrió un error con el procesador de pagos.');
            }
        }).render('#paypal-button-container');
    }

}


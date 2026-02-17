import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseDataService } from './supabase-data.service';
import { AuthService } from './auth.service';
import { ProviderProfile } from '../models';

// La configuración de planes ahora se maneja dinámicamente desde la base de datos
// a través de SupabaseDataService y SubscriptionService.

export interface SubscriptionConfig {
    id: string;
    nombre: string;
    precio: number;
    tipo: 'plan' | 'addon';
    max_paquetes: number;
}

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private supabaseData = inject(SupabaseDataService);
    private authService = inject(AuthService);

    // Configuración dinámica desde la DB
    private plansConfig = signal<SubscriptionConfig[]>([]);

    // Signal para los códigos de addons activos del proveedor
    public activeAddonsCodes = signal<string[]>([]);

    // Signal que expone el perfil completo del proveedor
    public providerProfile = computed(() => this.authService.currentUser() as ProviderProfile);

    // Signal derivado para el plan actual
    public currentPlan = computed(() => 'festeasy');

    // Consolidación de addons activos desde tabla junction y columna JSONB
    public allActiveAddons = computed(() => {
        const tableCodes = this.activeAddonsCodes();
        const profileCodes = this.providerProfile()?.addons || [];
        const combined = [...tableCodes, ...(Array.isArray(profileCodes) ? profileCodes : [])];
        return Array.from(new Set(combined));
    });

    // Signal para saber si el constructor web está habilitado
    public isWebBuilderActive = computed(() => {
        const active = this.allActiveAddons();
        return active.includes('WEB_BUILDER') || active.includes('website');
    });

    // Estado de la suscripción (pago activo) sugerido por el usuario
    public isSubscribed = computed(() => this.providerProfile()?.suscripcion_activa ?? false);

    // Signal derivado para los límites actuales (buscando en la config cargada)
    public limits = computed(() => {
        const configs = this.plansConfig();
        const config = configs.find(c => c.id === 'festeasy' && c.tipo === 'plan');

        return {
            nombre: config?.nombre || 'FestEasy Plus',
            maxPackets: config?.max_paquetes || 999,
            precio: config?.precio || 499,
            prioridadBusqueda: true,
            badge: true,
            color: 'primary'
        };
    });

    public planInfo = computed(() => {
        return this.plansConfig()
            .filter(c => c.tipo === 'plan')
            .map(c => ({
                id: c.id,
                nombre: c.nombre,
                precio: c.precio,
                limite: c.max_paquetes >= 999 ? 'Ilimitado' : `${c.max_paquetes} paquetes`,
                icon: 'workspace_premium',
                color: 'primary',
                popular: true,
                features: [
                    'Publicación de paquetes ilimitada',
                    'Prioridad máxima en búsquedas',
                    'Distintivo de Proveedor Verificado',
                    'Soporte prioritario'
                ]
            }));
    });

    public addonsInfo = computed(() => {
        const active = this.allActiveAddons();
        return this.plansConfig()
            .filter(c => c.tipo === 'addon')
            .map(c => {
                let icon = 'share';
                let desc = `Complemento de ${c.nombre} para tu negocio.`;

                // Normalización de IDs para la UI
                const normalizedId = (c.id === 'website') ? 'WEB_BUILDER' :
                    (c.id === 'ia') ? 'IA_ASSISTANT' :
                        (c.id === 'redes') ? 'SOCIAL_SHARE' : c.id;

                if (normalizedId === 'IA_ASSISTANT') {
                    icon = 'psychology';
                    desc = 'Optimiza tus respuestas y gestión con ayuda de IA.';
                } else if (normalizedId === 'WEB_BUILDER') {
                    icon = 'language';
                    desc = 'Crea tu propia página web profesional personalizada.';
                } else if (normalizedId === 'SOCIAL_SHARE') {
                    icon = 'share';
                    desc = 'Herramientas para potenciar tu presencia en redes sociales.';
                }

                return {
                    id: c.id, // Mantener ID original para el toggle/pago
                    nombre: c.nombre,
                    precio: c.precio,
                    icon: icon,
                    descripcion: desc,
                    active: active.includes(c.id) || active.includes(normalizedId)
                };
            });
    });

    constructor() {
        this.loadConfigs();
    }

    private async loadConfigs() {
        try {
            const configs = await this.supabaseData.getSubscriptionConfigs();
            this.plansConfig.set(configs);

            // Cargar addons activos si es proveedor
            const user = this.authService.currentUser();
            if (user && user.rol === 'provider') {
                const codes = await this.supabaseData.getProviderAddonsCodes(user.id);
                this.activeAddonsCodes.set(codes);
            }
        } catch (error) {
            console.error('Error loading subscription configs:', error);
        }
    }

    async refreshConfigs() {
        await this.loadConfigs();
    }

    canCreatePackage(currentCount: number): boolean {
        return currentCount < this.limits().maxPackets;
    }
}

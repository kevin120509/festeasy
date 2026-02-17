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

    // Signal que expone el perfil completo del proveedor
    public providerProfile = computed(() => this.authService.currentUser() as ProviderProfile);

    // Signal derivado para el plan actual
    public currentPlan = computed(() => {
        const rawPlan = this.providerProfile()?.tipo_suscripcion_actual;
        const plan = (rawPlan || 'libre').toString().toLowerCase().trim();

        if (plan === 'basico') return 'libre';
        if (plan === 'pro' || plan === 'premium' || plan === 'plus') return 'festeasy';

        return plan;
    });

    // Signal derivado para los límites actuales (buscando en la config cargada)
    public limits = computed(() => {
        const configs = this.plansConfig();
        const planId = this.currentPlan();
        const config = configs.find(c => c.id === planId && c.tipo === 'plan');

        if (config) {
            return {
                nombre: config.nombre,
                maxPackets: config.max_paquetes,
                precio: config.precio,
                // Valores cosméticos fijos o calculados
                prioridadBusqueda: planId === 'festeasy',
                badge: planId === 'festeasy',
                color: planId === 'festeasy' ? 'primary' : 'slate'
            };
        }

        // Fallback default coincide con 'libre' hardcoded por seguridad inicial
        return { nombre: 'Libre', maxPackets: 2, precio: 0, prioridadBusqueda: false, badge: false, color: 'slate' };
    });

    public planInfo = computed(() => {
        return this.plansConfig()
            .filter(c => c.tipo === 'plan')
            .map(c => ({
                id: c.id,
                nombre: c.nombre,
                precio: c.precio,
                limite: c.max_paquetes >= 999 ? 'Ilimitado' : `${c.max_paquetes} paquetes`,
                icon: c.id === 'festeasy' ? 'workspace_premium' : 'spa',
                color: c.id === 'festeasy' ? 'primary' : 'slate',
                popular: c.id === 'festeasy',
                features: c.id === 'festeasy'
                    ? ['Paquetes ilimitados', 'Prioridad alta', 'Distintivo verificado']
                    : ['Hasta 2 paquetes', 'Perfil básico']
            }));
    });

    public addonsInfo = computed(() => {
        return this.plansConfig()
            .filter(c => c.tipo === 'addon')
            .map(c => ({
                id: c.id,
                nombre: c.nombre,
                precio: c.precio,
                icon: c.id === 'ia' ? 'psychology' : (c.id === 'website' ? 'language' : 'share'),
                descripcion: `Complemento de ${c.nombre} para tu negocio.`
            }));
    });

    constructor() {
        this.loadConfigs();
    }

    private async loadConfigs() {
        try {
            const configs = await this.supabaseData.getSubscriptionConfigs();
            this.plansConfig.set(configs);
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

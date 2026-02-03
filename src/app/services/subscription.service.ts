import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseDataService } from './supabase-data.service';
import { AuthService } from './auth.service';
import { ProviderProfile } from '../models';

// Definición de límites y precios por plan
export const SUBSCRIPTION_LIMITS = {
    basico: {
        nombre: 'Básico',
        maxPackets: 4,
        precio: 300,
        prioridadBusqueda: false,
        badge: false,
        color: 'slate'
    },
    pro: {
        nombre: 'Pro',
        maxPackets: 8,
        precio: 900,
        prioridadBusqueda: true,
        badge: true,
        color: 'amber'
    },
    premium: {
        nombre: 'Premium',
        maxPackets: 999, // Ilimitado
        precio: 1500,
        prioridadBusqueda: true,
        badge: true,
        color: 'primary'
    }
};

export const PLAN_INFO = [
    {
        id: 'basico',
        nombre: 'Básico',
        precio: 300,
        limite: '4 paquetes',
        icon: 'spa',
        color: 'slate',
        features: ['Hasta 4 paquetes', 'Soporte estándar', 'Perfil básico']
    },
    {
        id: 'pro',
        nombre: 'Pro',
        precio: 900,
        limite: '8 paquetes',
        icon: 'rocket_launch',
        color: 'amber',
        features: ['Hasta 8 paquetes', 'Prioridad en búsqueda', 'Distintivo de confianza', 'Soporte prioritario']
    },
    {
        id: 'premium',
        nombre: 'Premium',
        precio: 1500,
        limite: 'Ilimitado',
        icon: 'workspace_premium',
        color: 'primary',
        popular: true,
        features: ['Paquetes ilimitados', 'Máxima prioridad', 'Distintivo Premium', 'Soporte 24/7', 'Analíticas avanzadas']
    }
];

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private supabaseData = inject(SupabaseDataService);
    private authService = inject(AuthService);

    // Signal que expone el perfil completo del proveedor desde el AuthService
    // Asumiendo que AuthService.currentUser() ya tiene la data del perfil
    public providerProfile = computed(() => this.authService.currentUser() as ProviderProfile);

    // Signal derivado para el plan actual (normalizado y validado)
    public currentPlan = computed(() => {
        const rawPlan = this.providerProfile()?.tipo_suscripcion_actual;
        const plan = (rawPlan || 'basico').toLowerCase();

        // Validamos que sea una llave válida de SUBSCRIPTION_LIMITS
        // Si es 'plus' (legacy) o desconocido, cae en 'basico'
        return (plan in SUBSCRIPTION_LIMITS) ? (plan as keyof typeof SUBSCRIPTION_LIMITS) : 'basico';
    });

    // Signal derivado para los límites actuales
    public limits = computed(() => SUBSCRIPTION_LIMITS[this.currentPlan()]);

    constructor() { }

    /**
     * Verifica si el proveedor puede crear más paquetes
     * @param currentCount Número actual de paquetes del proveedor
     */
    canCreatePackage(currentCount: number): boolean {
        return currentCount < this.limits().maxPackets;
    }

    // Aquí agregaremos la lógica de Stripe/PayPal en el siguiente paso
}

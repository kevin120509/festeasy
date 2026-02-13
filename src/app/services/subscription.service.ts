import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseDataService } from './supabase-data.service';
import { AuthService } from './auth.service';
import { ProviderProfile } from '../models';

// Definición de límites y precios por plan
export const SUBSCRIPTION_LIMITS = {
    libre: {
        nombre: 'Libre',
        maxPackets: 2,
        precio: 0,
        prioridadBusqueda: false,
        badge: false,
        color: 'slate'
    },
    festeasy: {
        nombre: 'FestEasy Plus',
        maxPackets: 999, // Ilimitado para el plan de pago
        precio: 499,
        prioridadBusqueda: true,
        badge: true,
        color: 'primary'
    }
};

export const ADDONS_INFO = [
    {
        id: 'website',
        nombre: 'Sitio Web Personalizado',
        precio: 299,
        icon: 'language',
        descripcion: 'Tu propia página FestEasy con diseño IA y portafolio público.'
    },
    {
        id: 'redes',
        nombre: 'Gestión de Redes',
        precio: 399,
        icon: 'share',
        descripcion: 'Herramientas avanzadas para compartir y medir impacto en redes.'
    },
    {
        id: 'ia',
        nombre: 'Asistente IA Pro',
        precio: 599,
        icon: 'psychology',
        descripcion: 'IA avanzada para generar descripciones, optimizar precios y responder clientes.'
    }
];

export const PLAN_INFO = [
    {
        id: 'libre',
        nombre: 'Plan Libre',
        precio: 0,
        limite: '2 paquetes',
        icon: 'spa',
        color: 'slate',
        features: ['Hasta 2 paquetes', 'Soporte estándar', 'Perfil básico']
    },
    {
        id: 'festeasy',
        nombre: 'Plan FestEasy Plus',
        precio: 499,
        limite: 'Ilimitado',
        icon: 'workspace_premium',
        color: 'primary',
        popular: true,
        features: ['Paquetes ilimitados', 'Máxima prioridad', 'Distintivo de Verificado', 'Soporte 24/7']
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
        const plan = (rawPlan || 'libre').toString().toLowerCase().trim();

        // Mapeo de planes antiguos a nuevos
        if (plan === 'basico') return 'libre';
        if (plan === 'pro' || plan === 'premium' || plan === 'plus') return 'festeasy';

        return (plan in SUBSCRIPTION_LIMITS) ? (plan as keyof typeof SUBSCRIPTION_LIMITS) : 'libre';
    });

    // Signal derivado para los límites actuales
    public limits = computed(() => (SUBSCRIPTION_LIMITS as any)[this.currentPlan()]);

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

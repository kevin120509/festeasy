import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseDataService } from './supabase-data.service';
import { AuthService } from './auth.service';
import { ProviderProfile } from '../models';

// Definición de límites por plan
export const SUBSCRIPTION_LIMITS = {
    basico: {
        maxPackets: 5,
        prioridadBusqueda: false,
        badge: false
    },
    plus: {
        maxPackets: 100, // Ilimitado en la práctica
        prioridadBusqueda: true,
        badge: true
    }
};

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private supabaseData = inject(SupabaseDataService);
    private authService = inject(AuthService);

    // Signal que expone el perfil completo del proveedor desde el AuthService
    // Asumiendo que AuthService.currentUser() ya tiene la data del perfil
    public providerProfile = computed(() => this.authService.currentUser() as ProviderProfile);

    // Signal derivado para el plan actual
    public currentPlan = computed(() => this.providerProfile()?.tipo_suscripcion_actual || 'basico');

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

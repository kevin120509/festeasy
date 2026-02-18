import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { SubscriptionService } from '../../services/subscription.service';

interface PlanConfig {
    id: string;
    nombre: string;
    precio: number;
    tipo: 'plan' | 'addon';
    icon: string;
    descripcion: string;
}

@Component({
    selector: 'app-subscription-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
            <!-- Header -->
            <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div class="flex items-center gap-4">
                        <a routerLink="/admin/dashboard" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span class="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
                        </a>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Gestión de Planes</h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Configurar precios de suscripción y complementos</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main -->
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                @if (isLoading()) {
                    <div class="flex items-center justify-center py-20">
                        <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                } @else if (errorMessage()) {
                    <div class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto mt-12">
                        <span class="material-symbols-outlined text-4xl mb-3">database_off</span>
                        <h3 class="font-bold mb-2">Error de Base de Datos</h3>
                        <p class="text-sm mb-4">{{ errorMessage() }}</p>
                        <button (click)="cargarConfiguraciones()" class="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
                            Reintentar
                        </button>
                    </div>
                } @else {
                    <div class="space-y-8">
                        <!-- Planes principales -->
                        <section>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-indigo-500">layers</span>
                                Planes de Suscripción
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                @for (plan of planes(); track plan.id) {
                                    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div class="flex items-center gap-4 mb-6">
                                            <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <span class="material-symbols-outlined text-indigo-600 dark:text-indigo-400">
                                                    {{ plan.id === 'festeasy' ? 'workspace_premium' : 'spa' }}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 class="font-bold text-gray-900 dark:text-white">{{ plan.nombre }}</h3>
                                                <p class="text-xs text-gray-500">Configurar precio base mensual</p>
                                            </div>
                                        </div>

                                        <div class="space-y-4">
                                            <div>
                                                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Precio Mensual</label>
                                                <div class="flex items-center gap-2">
                                                    <div class="relative flex-1">
                                                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                        <input 
                                                            type="number" 
                                                            [(ngModel)]="plan.precio"
                                                            class="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                                        >
                                                    </div>
                                                    <button 
                                                        (click)="guardarPrecio(plan)"
                                                        [disabled]="isSaving === plan.id"
                                                        class="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                                                    >
                                                        @if (isSaving === plan.id) {
                                                            <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                        } @else {
                                                            <span class="material-symbols-outlined text-sm">save</span>
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </section>

                        <!-- Complementos (Addons) -->
                        <section>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-emerald-500">add_circle</span>
                                Complementos (Addons)
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                @for (addon of addons(); track addon.id) {
                                    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div class="flex items-center gap-4 mb-6">
                                            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
                                                    {{ addon.id === 'ia' ? 'psychology' : (addon.id === 'website' ? 'language' : 'share') }}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 class="font-bold text-gray-900 dark:text-white text-sm">{{ addon.nombre }}</h3>
                                            </div>
                                        </div>

                                        <div class="space-y-4">
                                            <div>
                                                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Precio</label>
                                                <div class="flex items-center gap-2">
                                                    <div class="relative flex-1">
                                                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                        <input 
                                                            type="number" 
                                                            [(ngModel)]="addon.precio"
                                                            class="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm"
                                                        >
                                                    </div>
                                                    <button 
                                                        (click)="guardarPrecio(addon)"
                                                        [disabled]="isSaving === addon.id"
                                                        class="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                                                    >
                                                        @if (isSaving === addon.id) {
                                                            <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                        } @else {
                                                            <span class="material-symbols-outlined text-xs">save</span>
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </section>
                    </div>
                }
            </main>
        </div>
    `
})
export class SubscriptionManagementComponent implements OnInit {
    private supabaseData = inject(SupabaseDataService);
    private subscriptionService = inject(SubscriptionService);

    planes = signal<PlanConfig[]>([]);
    addons = signal<PlanConfig[]>([]);
    isLoading = signal(true);
    errorMessage = signal<string | null>(null);
    isSaving: string | null = null;

    ngOnInit() {
        this.cargarConfiguraciones();
    }

    async cargarConfiguraciones() {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        try {
            const configs = await this.supabaseData.getSubscriptionConfigs();
            if (configs.length === 0) {
                this.errorMessage.set('No se encontraron configuraciones. ¿Has ejecutado el script SQL?');
            }
            this.planes.set(configs.filter((c: any) => c.tipo === 'plan'));
            this.addons.set(configs.filter((c: any) => c.tipo === 'addon'));
        } catch (error: any) {
            console.error('Error cargando configs:', error);
            this.errorMessage.set('Error al conectar con la base de datos: ' + (error.message || 'Desconocido'));
        } finally {
            this.isLoading.set(false);
        }
    }

    async guardarPrecio(item: PlanConfig) {
        this.isSaving = item.id;
        try {
            await this.supabaseData.updatePlanPrice(item.id, item.precio);
            await this.subscriptionService.refreshConfigs();
            console.log('Precio del plan actualizado:', item.id, item.precio);
        } catch (error) {
            console.error('Error guardando precio:', error);
            alert('Error al guardar el precio');
        } finally {
            this.isSaving = null;
        }
    }
}

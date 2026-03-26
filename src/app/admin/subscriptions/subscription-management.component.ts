import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { SubscriptionService } from '../../services/subscription.service';
import { NotificationService } from '../../services/notification.service';

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
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <!-- Header -->
            <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <a routerLink="/admin/dashboard" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <span class="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
                            </a>
                            <div>
                                <h1 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">Gestión de Socios y Planes</h1>
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Panel de Control Pagos</p>
                            </div>
                        </div>
                        
                        <!-- Tabs -->
                        <div class="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                            <button (click)="activeTab.set('configs')" 
                                    [class.bg-white]="activeTab() === 'configs'"
                                    [class.text-[#523576]]="activeTab() === 'configs'"
                                    [class.shadow-sm]="activeTab() === 'configs'"
                                    class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all text-slate-500">
                                Precios y Planes
                            </button>
                            <button (click)="activeTab.set('providers')" 
                                    [class.bg-white]="activeTab() === 'providers'"
                                    [class.text-[#523576]]="activeTab() === 'providers'"
                                    [class.shadow-sm]="activeTab() === 'providers'"
                                    class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all text-slate-500">
                                Estado de Socios
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                @if (isLoading()) {
                    <div class="flex flex-col items-center justify-center py-24 animate-pulse">
                        <div class="w-12 h-12 rounded-full border-4 border-[#523576] border-t-transparent animate-spin mb-4"></div>
                        <span class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Cargando Datos...</span>
                    </div>
                }

                <!-- VISTA: CONFIGURACIÓN DE PRECIOS -->
                @if (activeTab() === 'configs' && !isLoading()) {
                    <div class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <section>
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Suscripciones Mensuales
                                </h2>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                @for (plan of planes(); track plan.id) {
                                    <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                        <div class="flex items-center gap-4 mb-8">
                                            <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                                <span class="material-symbols-outlined text-indigo-500 text-3xl">
                                                    {{ plan.id === 'festeasy' ? 'workspace_premium' : 'spa' }}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 class="text-lg font-black text-slate-800">{{ plan.nombre }}</h3>
                                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base del Negocio</p>
                                            </div>
                                        </div>

                                        <div class="space-y-6">
                                            <div class="space-y-2">
                                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Mensual (MXN)</label>
                                                <div class="relative group">
                                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                                                    <input type="number" [(ngModel)]="plan.precio"
                                                           class="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all">
                                                </div>
                                            </div>
                                            <button (click)="guardarPrecio(plan)" [disabled]="isSaving === plan.id"
                                                    class="w-full py-4 bg-[#523576] hover:bg-[#3a2653] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-purple-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                                @if (isSaving === plan.id) {
                                                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Sincronizando...
                                                } @else {
                                                    <span class="material-symbols-outlined text-sm">save</span>
                                                    Actualizar Tarifa
                                                }
                                            </button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </section>

                        <section>
                            <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Complementos Hero (Addons)
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                @for (addon of addons(); track addon.id) {
                                    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                        <div class="flex items-center gap-4 mb-6">
                                            <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                                <span class="material-symbols-outlined text-emerald-500">
                                                    {{ addon.id === 'ia' ? 'psychology' : (addon.id === 'website' ? 'language' : 'share') }}
                                                </span>
                                            </div>
                                            <h3 class="font-black text-slate-700">{{ addon.nombre }}</h3>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <div class="relative flex-1">
                                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">$</span>
                                                <input type="number" [(ngModel)]="addon.precio"
                                                       class="w-full pl-8 pr-3 py-2 bg-slate-50 border-none rounded-xl font-bold text-sm">
                                            </div>
                                            <button (click)="guardarPrecio(addon)" [disabled]="isSaving === addon.id"
                                                    class="p-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors">
                                                <span class="material-symbols-outlined text-sm">save</span>
                                            </button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </section>
                    </div>
                }

                <!-- VISTA: ESTADO DE SOCIOS -->
                @if (activeTab() === 'providers' && !isLoading()) {
                    <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <!-- Toolbar -->
                        <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                            <div class="relative flex-grow max-w-md">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">search</span>
                                <input type="text" [(ngModel)]="searchQuery" 
                                       placeholder="Buscar socio por nombre de negocio..."
                                       class="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all">
                            </div>
                            <div class="flex items-center gap-3">
                                 <button (click)="sendBulkReminder()" 
                                         class="px-6 py-3 bg-[#523576] hover:bg-[#3a2653] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-purple-100">
                                     <span class="material-symbols-outlined text-sm">campaign</span>
                                     Notificar a Todos
                                 </button>
                            </div>
                        </div>

                        <!-- Table -->
                        <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left">
                                    <thead>
                                        <tr class="bg-slate-50/50 border-b border-slate-100">
                                            <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Socio / Negocio</th>
                                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actual</th>
                                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Último Pago</th>
                                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vencimiento</th>
                                            <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-50">
                                        @for (prov of filteredProviders(); track prov.id) {
                                            <tr class="hover:bg-slate-50/80 transition-colors group">
                                                <td class="px-8 py-6">
                                                    <div class="flex items-center gap-4">
                                                        <div class="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 border-2 border-white shadow-sm overflow-hidden">
                                                            <img *ngIf="prov.avatar_url" [src]="prov.avatar_url" class="w-full h-full object-cover">
                                                        </div>
                                                        <div>
                                                            <div class="font-black text-slate-800 text-sm">{{ prov.nombre_negocio }}</div>
                                                            <div class="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <span class="material-symbols-outlined text-[10px]">person</span>
                                                                {{ prov.id.substring(0,8) }}...
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-6">
                                                    <span class="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight"
                                                          [ngClass]="prov.tipo_suscripcion_actual === 'festeasy' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'">
                                                        {{ prov.tipo_suscripcion_actual || 'Libre' }}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-6">
                                                    <div class="text-center font-bold text-slate-700 text-sm">
                                                       {{ prov.latest_subscription?.monto_pagado ? '$' + prov.latest_subscription.monto_pagado : '-' }}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-6">
                                                    <div class="text-center">
                                                        @if (prov.latest_subscription?.fecha_fin) {
                                                            <div class="text-xs font-black" [class.text-red-500]="isExpired(prov.latest_subscription.fecha_fin)">
                                                                {{ prov.latest_subscription.fecha_fin | date:'dd MMM yyyy' }}
                                                            </div>
                                                            <div class="text-[9px] font-bold" [class.text-red-400]="isExpired(prov.latest_subscription.fecha_fin)">
                                                                {{ getRemainingDays(prov.latest_subscription.fecha_fin) }}
                                                            </div>
                                                        } @else {
                                                            <span class="text-slate-300 text-xs">-</span>
                                                        }
                                                    </div>
                                                </td>
                                                <td class="px-8 py-6 text-right">
                                                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        @if (prov.telefono) {
                                                            <button (click)="openWhatsApp(prov)" 
                                                                    class="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                                    title="Enviar WhatsApp">
                                                                <span class="material-symbols-outlined text-sm">chat</span>
                                                            </button>
                                                        }
                                                        <button (click)="sendReminder(prov)" 
                                                                class="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-[#523576] hover:text-white transition-all shadow-sm"
                                                                title="Notificación Interna">
                                                            <span class="material-symbols-outlined text-sm">notifications_active</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        } @empty {
                                            <tr>
                                                <td colspan="5" class="px-8 py-20 text-center">
                                                    <div class="flex flex-col items-center">
                                                        <span class="material-symbols-outlined text-slate-200 text-6xl mb-4">search_off</span>
                                                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron socios</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                }
            </main>
        </div>
    `
})
export class SubscriptionManagementComponent implements OnInit {
    private supabaseData = inject(SupabaseDataService);
    private subscriptionService = inject(SubscriptionService);
    private notificationService = inject(NotificationService);

    activeTab = signal<'configs' | 'providers'>('configs');
    searchQuery = '';
    
    planes = signal<PlanConfig[]>([]);
    addons = signal<PlanConfig[]>([]);
    providers = signal<any[]>([]);

    isLoading = signal(true);
    errorMessage = signal<string | null>(null);
    isSaving: string | null = null;

    filteredProviders = computed(() => {
        const query = this.searchQuery.toLowerCase().trim();
        if (!query) return this.providers();
        return this.providers().filter(p => 
            p.nombre_negocio?.toLowerCase().includes(query) || 
            p.usuario_id?.toLowerCase().includes(query)
        );
    });

    ngOnInit() {
        this.cargarConfiguraciones();
        this.cargarProveedores();
    }

    async cargarConfiguraciones() {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        try {
            const configs = await this.supabaseData.getSubscriptionConfigs();
            this.planes.set(configs.filter((c: any) => c.tipo === 'plan'));
            this.addons.set(configs.filter((c: any) => c.tipo === 'addon'));
        } catch (error: any) {
            console.error('Error cargando configs:', error);
            this.errorMessage.set('Error al conectar con la base de datos');
        } finally {
            this.isLoading.set(false);
        }
    }

    async cargarProveedores() {
        try {
            const data = await this.supabaseData.getAllProvidersDetailed();
            this.providers.set(data);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
        }
    }

    async guardarPrecio(item: PlanConfig) {
        this.isSaving = item.id;
        try {
            await this.supabaseData.updatePlanPrice(item.id, item.precio);
            await this.subscriptionService.refreshConfigs();
        } catch (error) {
            console.error('Error guardando precio:', error);
            alert('Error al guardar el precio');
        } finally {
            this.isSaving = null;
        }
    }

    isExpired(date: string): boolean {
        if (!date) return false;
        return new Date(date).getTime() < new Date().getTime();
    }

    getRemainingDays(date: string): string {
        if (!date) return '';
        const diff = new Date(date).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
        if (days === 0) return 'Vence hoy';
        return `Quedan ${days} días`;
    }

    openWhatsApp(prov: any) {
        if (!prov.telefono) return;
        const msg = `Hola ${prov.nombre_negocio}, te saludamos de FestEasy. Te recordamos que tu suscripción vence pronto. El monto a pagar es $${prov.latest_subscription?.monto_pagado || 0}. Quedamos atentos.`;
        const url = `https://wa.me/${prov.telefono}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }

    async sendReminder(prov: any) {
        try {
            const plan = prov.latest_subscription?.plan || prov.tipo_suscripcion_actual || 'Base';
            const amount = prov.latest_subscription?.monto_pagado || 0;
            const dueDate = prov.latest_subscription?.fecha_fin;

            await this.notificationService.sendNotificationToUser({
                usuario_id: prov.usuario_id,
                tipo: 'recordatorio',
                titulo: 'Recordatorio de Pago',
                mensaje: `Tu suscripción al plan ${plan.toUpperCase()} está próxima a vencer (${dueDate ? new Date(dueDate).toLocaleDateString() : 'Pendiente'}). El monto a pagar es $${amount}.`,
                data: { type: 'payment_reminder', amount }
            }).toPromise();

            alert(`Recordatorio enviado a ${prov.nombre_negocio}`);
        } catch (error) {
            console.error('Error enviando recordatorio:', error);
            alert('No se pudo enviar la notificación');
        }
    }

    async sendBulkReminder() {
        const confirm = window.confirm('¿Estás seguro de enviar un recordatorio a todos los socios activos?');
        if (!confirm) return;

        const providers = this.providers().filter(p => p.tipo_suscripcion_actual !== 'libre');
        let count = 0;

        for (const prov of providers) {
            try {
                const plan = prov.latest_subscription?.plan || prov.tipo_suscripcion_actual || 'Base';
                const amount = prov.latest_subscription?.monto_pagado || 0;
                
                await this.notificationService.sendNotificationToUser({
                    usuario_id: prov.usuario_id,
                    tipo: 'recordatorio',
                    titulo: 'Recordatorio de Pago Mensual',
                    mensaje: `Hola ${prov.nombre_negocio}, te recordamos realizar tu pago mensual del plan ${plan.toUpperCase()} ($${amount}) para mantener tu cuenta activa.`,
                    data: { type: 'bulk_payment_reminder' }
                }).toPromise();
                count++;
            } catch (e) {
                console.warn('Error enviando a:', prov.nombre_negocio);
            }
        }

        alert(`Se enviaron ${count} notificaciones con éxito.`);
    }
}

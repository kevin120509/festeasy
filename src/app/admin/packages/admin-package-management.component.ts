import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';

interface PaqueteAdmin {
    id: string;
    nombre: string;
    precio_base: number;
    proveedor_id: string;
    nombre_negocio?: string;
    estado: string;
    creado_en: string;
}

@Component({
    selector: 'app-admin-package-management',
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
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Gestión de Paquetes</h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Modificar precios de servicios en marketplace</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main -->
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Filtros -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                    <div class="relative max-w-md">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                        <input 
                            type="text" 
                            [(ngModel)]="busqueda"
                            placeholder="Buscar por paquete o negocio..."
                            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>
                </div>

                @if (isLoading()) {
                    <div class="flex items-center justify-center py-20">
                        <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                } @else {
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        @for (paquete of paquetesFiltrados(); track paquete.id) {
                            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="min-w-0">
                                        <h3 class="font-bold text-gray-900 dark:text-white truncate">{{ paquete.nombre }}</h3>
                                        <p class="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{{ paquete.nombre_negocio }}</p>
                                    </div>
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" 
                                          [class]="paquete.estado === 'publicado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
                                        {{ paquete.estado }}
                                    </span>
                                </div>

                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Precio Base</label>
                                        <div class="flex items-center gap-2">
                                            <div class="relative flex-1">
                                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                                <input 
                                                    type="number" 
                                                    [(ngModel)]="paquete.precio_base"
                                                    class="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                                                >
                                            </div>
                                            <button 
                                                (click)="guardarPrecio(paquete)"
                                                [disabled]="isSaving === paquete.id"
                                                class="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                                            >
                                                @if (isSaving === paquete.id) {
                                                    <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                } @else {
                                                    <span class="material-symbols-outlined text-sm">save</span>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-between text-[10px] text-gray-500">
                                        <span>ID: {{ paquete.id.substring(0,8) }}</span>
                                        <span>Fecha: {{ paquete.creado_en | date:'shortDate' }}</span>
                                    </div>
                                </div>
                            </div>
                        } @empty {
                            <div class="col-span-full py-20 text-center">
                                <span class="material-symbols-outlined text-6xl text-gray-200 mb-4">inventory_2</span>
                                <p class="text-gray-500">No se encontraron paquetes registrados.</p>
                            </div>
                        }
                    </div>
                }
            </main>
        </div>
    `,
    styles: [`
        :host { display: block; }
    `]
})
export class AdminPackageManagementComponent implements OnInit {
    private supabaseData = inject(SupabaseDataService);

    paquetes = signal<PaqueteAdmin[]>([]);
    busqueda = '';
    isLoading = signal(true);
    isSaving: string | null = null;

    paquetesFiltrados = computed(() => {
        const query = this.busqueda.toLowerCase().trim();
        if (!query) return this.paquetes();
        return this.paquetes().filter(p =>
            p.nombre.toLowerCase().includes(query) ||
            p.nombre_negocio?.toLowerCase().includes(query)
        );
    });

    ngOnInit() {
        this.cargarTodosPaquetes();
    }

    async cargarTodosPaquetes() {
        this.isLoading.set(true);
        try {
            // Reutilizamos el método existente o creamos uno nuevo para TODOS los paquetes
            // Por ahora, usaremos una consulta directa para obtener todos
            const { data, error } = await this.supabaseData.supabase
                .from('paquetes_proveedor')
                .select(`
                    id,
                    nombre,
                    precio_base,
                    estado,
                    creado_en,
                    proveedor_usuario_id,
                    perfil_proveedor (nombre_negocio)
                `)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            const mapeados: PaqueteAdmin[] = data.map((p: any) => ({
                id: p.id,
                nombre: p.nombre,
                precio_base: p.precio_base,
                proveedor_id: p.proveedor_usuario_id,
                nombre_negocio: p.perfil_proveedor?.nombre_negocio,
                estado: p.estado,
                creado_en: p.creado_en
            }));

            this.paquetes.set(mapeados);
        } catch (error) {
            console.error('Error cargando todos los paquetes:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    async guardarPrecio(paquete: PaqueteAdmin) {
        this.isSaving = paquete.id;
        try {
            await this.supabaseData.updatePackagePrice(paquete.id, paquete.precio_base);
            // Mostrar éxito (podría ser un toast, pero usaremos alert para simplificar como en otros componentes admin)
            console.log('Precio actualizado:', paquete.id, paquete.precio_base);
        } catch (error) {
            console.error('Error guardando precio:', error);
            alert('Error al guardar el precio');
        } finally {
            this.isSaving = null;
        }
    }
}

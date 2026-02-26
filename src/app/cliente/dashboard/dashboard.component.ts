import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-cliente-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.component.css'
})
export class ClienteDashboardComponent implements OnInit {
    auth = inject(AuthService);
    supabaseData = inject(SupabaseDataService);

    router = inject(Router);

    items: MenuItem[] | undefined;

    // Métricas
    metricas = signal({
        solicitudesTotales: 0,
        cotizacionesPendientes: 0
    });


    // Todas las solicitudes del cliente (raw data)
    misSolicitudes = signal<any[]>([]);

    // Mapeo unificado para la UI
    actividadesMapped = computed(() => {
        return this.misSolicitudes().map(req => {
            const rawProv = req.perfil_proveedor;
            const provData = Array.isArray(rawProv) ? rawProv[0] : rawProv;

            return {
                id: req.id,
                proveedor: provData?.nombre_negocio || 'Proveedor',
                servicio: req.titulo_evento || 'Evento Especial',
                fecha: new Date(req.fecha_servicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                estado: req.estado,
                estadoLabel: this.formatEstado(req.estado),
                monto: req.monto_total || 0,
                hora: req.hora_servicio || '12:00',
                direccion: req.direccion_servicio || 'Ubicación no disponible'
            };
        });
    });

    // Categorías de solicitudes automáticas
    reservadas = computed(() => this.actividadesMapped().filter(r => ['reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(r.estado)));
    pendientesPago = computed(() => this.actividadesMapped().filter(r => ['esperando_anticipo', 'entregado_pendiente_liq'].includes(r.estado)));
    pendientesRespuesta = computed(() => this.actividadesMapped().filter(r => r.estado === 'pendiente_aprobacion'));
    historial = computed(() => this.actividadesMapped().filter(r => ['rechazada', 'cancelada', 'abandonada', 'finalizado'].includes(r.estado)));

    // Tab activo
    activeTab = signal<'reservadas' | 'por_pagar' | 'pendientes' | 'historial'>('reservadas');

    loading = signal(true);
    showQuickRequestModal = signal(true);

    ngOnInit(): void {
        this.items = [
            {
                label: 'Dashboard',
                icon: 'pi pi-chart-bar',
                routerLink: '/cliente/dashboard'
            },
            {
                label: 'Mis Solicitudes',
                icon: 'pi pi-file',
                routerLink: '/cliente/solicitudes'
            },
            {
                separator: true
            },
            {
                label: 'Cerrar Sesión',
                icon: 'pi pi-power-off',
                command: () => {
                    this.auth.logout();
                }
            }
        ];
        this.cargarDatos();
    }

    closeQuickRequestModal() {
        this.showQuickRequestModal.set(false);
    }

    navigateToCreateRequest() {
        this.closeQuickRequestModal();
        this.router.navigate(['/cliente/solicitudes/crear']);
    }

    async cargarDatos(): Promise<void> {
        // Esperar a que la sesión esté lista
        const ok = await this.auth.waitForAuth();
        if (!ok) {
            this.loading.set(false);
            return;
        }

        const user = this.auth.currentUser();
        if (!user || !user.id) {
            this.loading.set(false);
            return;
        }

        this.supabaseData.getRequestsByClient(user.id).subscribe({
            next: (requests) => {
                this.misSolicitudes.set(requests);

                // Calcular Métricas
                const pendientes = requests.filter(r => r.estado === 'pendiente_aprobacion').length;
                const reservadasCount = requests.filter(r => ['reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(r.estado)).length;

                this.metricas.set({
                    solicitudesTotales: reservadasCount,
                    cotizacionesPendientes: pendientes
                });

                // Set initial tab based on content priority
                if (this.reservadas().length > 0) this.activeTab.set('reservadas');
                else if (this.pendientesPago().length > 0) this.activeTab.set('por_pagar');
                else if (this.pendientesRespuesta().length > 0) this.activeTab.set('pendientes');
                else if (this.historial().length > 0) this.activeTab.set('historial');
                else this.activeTab.set('reservadas');

                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
                this.loading.set(false);
            }
        });
    }

    setActiveTab(tab: 'reservadas' | 'por_pagar' | 'pendientes' | 'historial') {
        this.activeTab.set(tab);
    }

    formatEstado(estado: string): string {
        const estados: Record<string, string> = {
            'pendiente_aprobacion': 'Pendiente',
            'esperando_anticipo': 'Esperando anticipo',
            'reservado': 'Reservado',
            'en_progreso': 'En progreso',
            'rechazada': 'Rechazado',
            'finalizado': 'Completado',
            'cancelada': 'Cancelado'
        };
        return estados[estado] || estado;
    }

    getEstadoClass(estado: string): string {
        const clases: Record<string, string> = {
            'pendiente_aprobacion': 'estado-pendiente',
            'esperando_anticipo': 'estado-reservado',
            'reservado': 'estado-reservado',
            'en_progreso': 'estado-progreso',
            'rechazada': 'estado-rechazado',
            'finalizado': 'estado-completado',
            'cancelada': 'estado-cancelado'
        };
        return clases[estado] || 'estado-pendiente';
    }

    // Eliminar solicitud
    async eliminarSolicitud(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud del historial?')) return;

        try {
            await this.supabaseData.deleteRequestById(id);
            // Al actualizar misSolicitudes, los computeds se encargan del resto
            this.misSolicitudes.update(items => items.filter(s => s.id !== id));
            console.log('✅ Solicitud eliminada de la vista local');
        } catch (e) {
            console.error('Error al eliminar:', e);
            alert('Error al eliminar la solicitud. Verifica tu conexión.');
        }
    }

    getUserName(): string {
        const user = this.auth.currentUser();
        return user?.nombre_completo || user?.nombre || user?.email || user?.correo_electronico || 'Usuario';
    }
}
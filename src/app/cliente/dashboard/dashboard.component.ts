import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
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
export class ClienteDashboardComponent implements OnInit, OnDestroy {
    auth = inject(AuthService);
    supabaseData = inject(SupabaseDataService);

    router = inject(Router);

    items: MenuItem[] | undefined;

    countdownString = signal<string>('00:00:00');
    private countdownInterval: any;

    // Métricas
    metricas = signal({
        solicitudesTotales: 0,
        cotizacionesPendientes: 0,
        enNegociacion: 0
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
                fechaRaw: req.fecha_servicio,
                creadoEn: req.created_at || req.creado_en || req.fecha_servicio,
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
    enNegociacion = computed(() => this.actividadesMapped().filter(r => r.estado === 'en_negociacion'));
    historial = computed(() => this.actividadesMapped().filter(r => ['rechazada', 'cancelada', 'abandonada', 'finalizado'].includes(r.estado)));

    // Tab activo
    activeTab = signal<'reservadas' | 'por_pagar' | 'pendientes' | 'en_negociacion' | 'historial'>('reservadas');

    loading = signal(true);
    showQuickRequestModal = signal(!localStorage.getItem('festeasy_hide_quick_modal'));

    // Helper para agrupar items por fecha de servicio
    groupByDay(items: any[]): { label: string; items: any[] }[] {
        const groups = new Map<string, any[]>();
        const sorted = [...items].sort((a, b) => new Date(a.fechaRaw || a.creadoEn).getTime() - new Date(b.fechaRaw || b.creadoEn).getTime());
        for (const item of sorted) {
            const d = new Date(item.fechaRaw || item.creadoEn);
            const key = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(item);
        }
        return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
    }

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
        this.startCountdownTimer();
    }

    ngOnDestroy(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    startCountdownTimer() {
        this.updateCountdown(); // Llamada inicial
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    updateCountdown() {
        const pendientes = this.pendientesRespuesta();
        if (!pendientes || pendientes.length === 0) {
            this.countdownString.set('00:00:00');
            return;
        }

        const firstRequest = pendientes[0];
        const createdAt = new Date(firstRequest.creadoEn).getTime();
        const expirationTime = createdAt + 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const diff = Math.max(0, expirationTime - now);

        if (diff === 0) {
            this.countdownString.set('Expirado');
        } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const hh = hours.toString().padStart(2, '0');
            const mm = minutes.toString().padStart(2, '0');
            const ss = seconds.toString().padStart(2, '0');

            this.countdownString.set(`${hh}:${mm}:${ss}`);
        }
    }

    closeQuickRequestModal() {
        this.showQuickRequestModal.set(false);
    }

    dismissModalPermanently() {
        localStorage.setItem('festeasy_hide_quick_modal', 'true');
        this.showQuickRequestModal.set(false);
    }

    navigateToCreateRequest() {
        this.closeQuickRequestModal();
        this.router.navigate(['/cliente/solicitudes/crear']);
    }

    // Helper para calcular tiempo transcurrido desde la creación
    tiempoTranscurrido(creadoEn: string): string {
        const now = new Date().getTime();
        const created = new Date(creadoEn).getTime();
        const diff = now - created;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `hace ${days}d`;
        if (hours > 0) return `hace ${hours}h`;
        const mins = Math.floor(diff / (1000 * 60));
        return `hace ${mins}m`;
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
                const enNegoc = requests.filter(r => r.estado === 'en_negociacion').length;
                const reservadasCount = requests.filter(r => ['reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(r.estado)).length;

                this.metricas.set({
                    solicitudesTotales: reservadasCount,
                    cotizacionesPendientes: pendientes,
                    enNegociacion: enNegoc
                });

                // Set initial tab based on content priority
                if (this.reservadas().length > 0) this.activeTab.set('reservadas');
                else if (this.enNegociacion().length > 0) this.activeTab.set('en_negociacion');
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

    setActiveTab(tab: 'reservadas' | 'por_pagar' | 'pendientes' | 'en_negociacion' | 'historial') {
        this.activeTab.set(tab);
    }

    formatEstado(estado: string): string {
        const estados: Record<string, string> = {
            'pendiente_aprobacion': 'Pendiente de Aprobación',
            'en_negociacion': 'En Negociación',
            'esperando_anticipo': 'Esperando Anticipo',
            'reservado': 'Reservado',
            'en_progreso': 'En Progreso',
            'entregado_pendiente_liq': 'Por Liquidar',
            'rechazada': 'Rechazado',
            'finalizado': '✓ Completado',
            'cancelada': 'Cancelado',
            'aprobado': 'Aprobado'
        };
        if (estados[estado]) return estados[estado];
        if (!estado) return 'Desconocido';
        return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getEstadoClass(estado: string): string {
        const clases: Record<string, string> = {
            'pendiente_aprobacion': 'estado-pendiente',
            'en_negociacion': 'estado-negociacion',
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

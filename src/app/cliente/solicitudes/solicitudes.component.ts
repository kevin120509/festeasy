import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SolicitudesService, SolicitudCliente } from './solicitudes.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-mis-solicitudes',
    standalone: true,
    imports: [CommonModule, RouterLink],
    providers: [ConfirmationService],
    templateUrl: './solicitudes.component.html',
    styles: [] // Usaremos Tailwind en el HTML
})
export class MisSolicitudesComponent implements OnInit {
    private service = inject(SolicitudesService);
    private auth = inject(AuthService);
    private confirmationService = inject(ConfirmationService);

    // Estado
    activeTab = signal<'todas' | 'activas' | 'cotizando' | 'contratadas' | 'finalizadas'>('todas');
    loading = signal(true);

    // Datos crudos
    private allRequests = signal<SolicitudCliente[]>([]);

    // Datos filtrados (Computed Signal)
    filteredRequests = computed(() => {
        const tab = this.activeTab();
        const requests = this.allRequests();

        if (tab === 'todas') return requests;

        return requests.filter(req => {
            if (tab === 'activas') return ['pendiente_aprobacion', 'pendiente', 'esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(req.estado);
            if (tab === 'cotizando') return ['pendiente_aprobacion', 'pendiente'].includes(req.estado);
            if (tab === 'contratadas') return ['esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(req.estado);
            if (tab === 'finalizadas') return req.estado === 'finalizado';
            return true;
        });
    });

    async ngOnInit() {
        const user = this.auth.currentUser();
        if (user) {
            await this.service.limpiarSolicitudesExpiradas(user.id);
        }
        this.cargarSolicitudes();
    }

    cargarSolicitudes() {
        this.loading.set(true);
        this.service.getMisSolicitudes().subscribe({
            next: (data) => {
                this.allRequests.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando solicitudes', err);
                this.loading.set(false);
            }
        });
    }

    setTab(tab: 'todas' | 'activas' | 'cotizando' | 'contratadas' | 'finalizadas') {
        this.activeTab.set(tab);
    }

    // Helper para calcular días faltantes
    getDaysRemaining(dateStr: string): string {
        const eventDate = new Date(dateStr);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Pasado';
        if (diffDays === 0) return 'Hoy';
        return `Faltan ${diffDays} días`;
    }

    // Helper para clases de badge
    getStatusBadgeClass(estado: string): string {
        switch (estado) {
            case 'pendiente_aprobacion': return 'bg-amber-50 text-amber-600';
            case 'esperando_anticipo': return 'bg-blue-50 text-blue-600';
            case 'reservado': return 'bg-indigo-50 text-indigo-600';
            case 'en_progreso': return 'bg-orange-50 text-orange-600';
            case 'entregado_pendiente_liq': return 'bg-purple-50 text-purple-600';
            case 'finalizado': return 'bg-green-50 text-green-600';
            case 'rechazada':
            case 'cancelada':
            case 'abandonada': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    }

    async eliminarSolicitud(id: string) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que deseas eliminar esta solicitud permanentemente? Esta acción no se puede deshacer.',
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: async () => {
                try {
                    // Eliminar localmente primero para feedback instantáneo
                    const current = this.allRequests();
                    this.allRequests.set(current.filter(req => req.id !== id));

                    await this.service.eliminarSolicitud(id);
                    console.log('✅ Solicitud eliminada con éxito');
                } catch (error: any) {
                    console.error('Error eliminando solicitud:', error);
                    const msg = error.message || 'No se pudo eliminar la solicitud. Inténtalo de nuevo.';
                    alert(msg);
                    // Revertir si falló
                    this.cargarSolicitudes();
                }
            }
        });
    }
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SolicitudesService, SolicitudCliente } from './solicitudes.service';

@Component({
    selector: 'app-mis-solicitudes',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './solicitudes.component.html',
    styles: [] // Usaremos Tailwind en el HTML
})
export class MisSolicitudesComponent implements OnInit {
    private service = inject(SolicitudesService);

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
            if (tab === 'activas') return ['pendiente', 'cotizando', 'contratado'].includes(req.estado);
            if (tab === 'cotizando') return req.estado === 'cotizando';
            if (tab === 'contratadas') return req.estado === 'contratado';
            if (tab === 'finalizadas') return req.estado === 'finalizado';
            return true;
        });
    });

    ngOnInit() {
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
            case 'cotizando': return 'bg-red-50 text-red-600';
            case 'contratado': return 'bg-green-50 text-green-600';
            case 'pendiente': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-50 text-gray-600';
        }
    }

    async eliminarSolicitud(id: string) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud permanentemente?')) return;
        
        try {
            await this.service.eliminarSolicitud(id);
            // Actualizar lista solo si tuvo éxito
            this.allRequests.set(this.allRequests().filter(req => req.id !== id));
            // Recargar para asegurar sincronía con DB
            setTimeout(() => this.cargarSolicitudes(), 1000);
        } catch (error: any) {
            console.error('Error eliminando solicitud:', error);
            // Mostrar mensaje específico si viene del servicio
            const msg = error.message || 'No se pudo eliminar la solicitud. Inténtalo de nuevo.';
            alert(msg);
            // Revertir estado local si hubo error (aunque no lo cambiamos antes, recargar es bueno)
            this.cargarSolicitudes();
        }
    }
}

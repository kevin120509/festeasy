import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface SolicitudEvento {
    id: string;
    proveedor_nombre: string;
    proveedor_avatar?: string;
    titulo_evento?: string;
    fecha_servicio: string;
    hora_inicio?: string;
    hora_fin?: string;
    direccion_servicio: string;
    estado: 'pendiente_aprobacion' | 'rechazada' | 'esperando_anticipo' | 'reservado' | 'en_progreso' | 'entregado_pendiente_liq' | 'finalizado' | 'cancelada' | 'abandonada';
    monto_total?: number;
}

@Component({
    selector: 'app-seguimiento-evento',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './seguimiento.component.html'
})
export class SeguimientoEventoComponent implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);

    activeTab = signal<'activas' | 'historial'>('activas');
    loading = signal(true);
    solicitudes = signal<SolicitudEvento[]>([]);

    solicitudesFiltradas = computed(() => {
        const tab = this.activeTab();
        const all = this.solicitudes();

        if (tab === 'activas') {
            // Estados activos: pendiente, esperando pago, reservado, en progreso
            return all.filter(s => ['pendiente_aprobacion', 'esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(s.estado));
        } else {
            // Historial: finalizados, cancelados, rechazados
            return all.filter(s => ['rechazada', 'finalizado', 'cancelada', 'abandonada'].includes(s.estado));
        }
    });

    ngOnInit() {
        this.cargarSolicitudes();
    }

    cargarSolicitudes() {
        this.loading.set(true);
        const user = this.auth.currentUser();
        if (!user) {
            this.loading.set(false);
            return;
        }

        this.api.getClientRequestsReal().subscribe({
            next: (data) => {
                console.log('📋 Solicitudes cargadas:', data);
                this.solicitudes.set(data.map(this.mapearSolicitud));
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando solicitudes:', err);
                this.loading.set(false);
            }
        });
    }

    private mapearSolicitud(req: any): SolicitudEvento {
        return {
            id: req.id,
            proveedor_nombre: req.proveedor?.nombre_negocio || 'Proveedor',
            proveedor_avatar: req.proveedor?.avatar_url,
            titulo_evento: req.titulo_evento || 'Reservación',
            fecha_servicio: req.fecha_servicio,
            direccion_servicio: req.direccion_servicio || 'Por definir',
            estado: req.estado || 'pendiente_aprobacion',
            monto_total: req.monto_total
        };
    }

    setTab(tab: 'activas' | 'historial') {
        this.activeTab.set(tab);
    }

    getEstadoClase(estado: string): string {
        switch (estado) {
            case 'reservado': return 'bg-green-50 text-green-700';
            case 'pendiente_aprobacion': return 'bg-yellow-50 text-yellow-700';
            case 'esperando_anticipo': return 'bg-orange-50 text-orange-700';
            case 'rechazada': 
            case 'cancelada': 
            case 'abandonada': return 'bg-red-50 text-red-700';
            case 'en_progreso': return 'bg-blue-50 text-blue-700';
            case 'entregado_pendiente_liq': return 'bg-purple-50 text-purple-700';
            case 'finalizado': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    }

    getEstadoTexto(estado: string): string {
        switch (estado) {
            case 'reservado': return 'Confirmado';
            case 'pendiente_aprobacion': return 'Esperando al Proveedor';
            case 'esperando_anticipo': return 'Pendiente de Pago';
            case 'rechazada': return 'Rechazada';
            case 'cancelada': return 'Cancelada';
            case 'abandonada': return 'Abandonada';
            case 'en_progreso': return 'En Progreso';
            case 'entregado_pendiente_liq': return 'Pendiente de Liquidar';
            case 'finalizado': return 'Finalizado';
            default: return estado;
        }
    }

    formatearFecha(fechaStr: string): string {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    }
}

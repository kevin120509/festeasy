import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';
import { ConfirmationService } from 'primeng/api';
import { ValidarPin } from '../validar-pin/validar-pin';
import { ServiceRequest } from '../../models';
import { esDiaDelEvento, formatearFechaEvento } from '../../utils/date.utils';
import { AvatarModule } from 'primeng/avatar';



interface SolicitudProveedor {
    id: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    titulo_evento?: string;
    monto_total: number;
    fecha_servicio: string;
    direccion_servicio: string;
    estado: 'pendiente_aprobacion' | 'rechazada' | 'esperando_anticipo' | 'reservado' | 'en_progreso' | 'entregado_pendiente_liq' | 'finalizado' | 'cancelada' | 'abandonada';
    creado_en?: string;
    client?: {
        avatar_url?: string;
    };
}

type TabType = 'pendientes' | 'confirmadas' | 'rechazado' | 'todo';

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, ValidarPin, AvatarModule],
    providers: [ConfirmationService],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    public auth = inject(AuthService);
    public api = inject(ApiService);
    private confirmationService = inject(ConfirmationService);

    tabActivo = signal<TabType>('pendientes');
    isLoading = signal(true);
    mensajeExito = signal('');
    mensajeError = signal('');
    procesando = signal<string | null>(null);

    // Control del modal de validación de PIN
    mostrarModalPin = signal(false);
    solicitudSeleccionada = signal<string>('');

    solicitudes = signal<SolicitudProveedor[]>([]);

    solicitudesFiltradas = computed(() => {
        const tab = this.tabActivo();
        const all = this.solicitudes();

        switch (tab) {
            case 'pendientes':
                return all.filter(s => s.estado === 'pendiente_aprobacion');
            case 'confirmadas':
                return all.filter(s => ['esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(s.estado));
            case 'rechazado':
                return all.filter(s => s.estado === 'rechazada');
            case 'todo':
                return all;
            default:
                return all;
        }
    });

    contadores = computed(() => {
        const all = this.solicitudes();
        return {
            pendientes: all.filter(s => s.estado === 'pendiente_aprobacion').length,
            confirmadas: all.filter(s => ['esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(s.estado)).length,
            rechazado: all.filter(s => s.estado === 'rechazada').length,
            todo: all.length
        };
    });

    ngOnInit(): void {
        this.cargarSolicitudes();
    }

    cargarSolicitudes() {
        this.isLoading.set(true);

        this.api.getProviderRequestsReal().subscribe({
            next: (data) => {
                console.log('📋 Solicitudes proveedor:', data);
                this.solicitudes.set(data.map(this.mapearSolicitud));
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error cargando solicitudes:', err);
                this.isLoading.set(false);
            }
        });
    }

    private mapearSolicitud(req: any): SolicitudProveedor {
        const rawCliente = req.perfil_cliente || req.cliente;
        const clienteData = Array.isArray(rawCliente) ? rawCliente[0] : rawCliente;

        return {
            id: req.id,
            cliente_nombre: clienteData?.nombre_completo || 'Cliente',
            cliente_telefono: clienteData?.telefono,
            titulo_evento: req.titulo_evento || 'Reservación',
            monto_total: req.monto_total || 0,
            fecha_servicio: req.fecha_servicio,
            direccion_servicio: req.direccion_servicio || 'Por definir',
            estado: req.estado || 'pendiente_aprobacion',
            creado_en: req.creado_en,
            client: clienteData
        };
    }

    cambiarTab(tab: TabType) {
        this.tabActivo.set(tab);
    }

    aceptarSolicitud(solId: string) {
        if (this.procesando()) return;
        this.procesando.set(solId);

        // Cambiar a estado 'esperando_anticipo' cuando el proveedor acepta
        this.api.updateSolicitudEstado(solId, 'esperando_anticipo').subscribe({
            next: () => {
                this.solicitudes.update(list =>
                    list.map(s => s.id === solId ? { ...s, estado: 'esperando_anticipo' as const } : s)
                );
                this.procesando.set(null);
                this.mensajeExito.set('¡Solicitud aceptada!');
                setTimeout(() => this.mensajeExito.set(''), 3000);
            },
            error: (err) => {
                console.error('Error aceptando solicitud:', err);
                this.mensajeError.set('Error al aceptar la solicitud');
                setTimeout(() => this.mensajeError.set(''), 3000);
                this.procesando.set(null);
            }
        });
    }

    rechazarSolicitud(solId: string) {
        if (this.procesando()) return;

        this.confirmationService.confirm({
            message: '¿Estás seguro de rechazar esta solicitud? El cliente será notificado de la cancelación.',
            header: 'Confirmar Rechazo',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: () => {
                this.procesando.set(solId);

                this.api.updateSolicitudEstado(solId, 'rechazada').subscribe({
                    next: () => {
                        this.solicitudes.update(list =>
                            list.map(s => s.id === solId ? { ...s, estado: 'rechazada' as const } : s)
                        );
                        this.procesando.set(null);
                        this.mensajeExito.set('Solicitud rechazada');
                        setTimeout(() => this.mensajeExito.set(''), 3000);
                    },
                    error: (err) => {
                        console.error('Error rechazando solicitud:', err);
                        this.mensajeError.set('Error al rechazar la solicitud');
                        setTimeout(() => this.mensajeError.set(''), 3000);
                        this.procesando.set(null);
                    }
                });
            }
        });
    }

    formatearFecha(fechaStr: string): string {
        if (!fechaStr) return 'Por definir';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    tiempoDesdeCreacion(fechaStr: string): string {
        if (!fechaStr) return '';
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diffMs = ahora.getTime() - fecha.getTime();
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHoras < 1) return 'Hace unos minutos';
        if (diffHoras < 24) return `Hace ${diffHoras}h`;
        const diffDias = Math.floor(diffHoras / 24);
        return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    }

    /**
     * Abrir modal de validación de PIN
     */
    abrirModalPin(solicitudId: string) {
        this.solicitudSeleccionada.set(solicitudId);
        this.mostrarModalPin.set(true);
    }

    /**
     * Cerrar modal de validación de PIN
     */
    cerrarModalPin() {
        this.mostrarModalPin.set(false);
        this.solicitudSeleccionada.set('');
    }

    /**
     * Manejar PIN validado exitosamente
     */
    onPinValidado(solicitud: ServiceRequest) {
        console.log('✅ PIN validado exitosamente:', solicitud);

        // Actualizar la solicitud en la lista con el nuevo estado
        this.solicitudes.update(list =>
            list.map(s => s.id === solicitud.id ? { ...s, estado: 'finalizado' as const } : s)
        );

        // Mostrar mensaje de éxito
        this.mensajeExito.set('¡PIN validado! Servicio finalizado exitosamente.');
        setTimeout(() => this.mensajeExito.set(''), 3000);

        // Cerrar modal
        this.cerrarModalPin();
    }

    /**
     * 🔒 LÓGICA DE ACTIVACIÓN: Verifica si hoy es el día del evento
     * Controla la habilitación del botón "Validar PIN"
     */
    esDiaDelEvento(fechaServicio: string): boolean {
        return esDiaDelEvento(fechaServicio);
    }

    /**
     * 📅 Formatea la fecha del evento para mostrar al proveedor
     */
    formatearFechaCompleta(fechaServicio: string): string {
        return formatearFechaEvento(fechaServicio);
    }
}

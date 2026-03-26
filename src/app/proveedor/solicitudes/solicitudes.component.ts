import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ValidarPin } from '../validar-pin/validar-pin';
import { ServiceRequest } from '../../models';
import { esDiaDelEvento, formatearFechaEvento } from '../../utils/date.utils';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';


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
    cliente?: {
        avatar_url?: string;
    };
}

type TabType = 'pendientes' | 'confirmadas' | 'rechazado' | 'todo';

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, ValidarPin, AvatarModule, ConfirmDialogModule, TooltipModule],
    providers: [ConfirmationService],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    public auth = inject(AuthService);
    public api = inject(ApiService);
    private router = inject(Router);
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
        // Intentar obtener los datos del cliente de varias propiedades posibles por el JOIN
        const rawCliente = req.cliente || req.perfil_cliente;
        const clienteData = Array.isArray(rawCliente) ? rawCliente[0] : rawCliente;

        // Búsqueda exhaustiva del nombre
        const nombreFinal = clienteData?.nombre_completo ||
            clienteData?.nombre_negocio ||
            clienteData?.nombre ||
            req.cliente_nombre ||
            'Cliente';

        return {
            id: req.id,
            cliente_nombre: nombreFinal,
            cliente_telefono: clienteData?.telefono,
            titulo_evento: req.titulo_evento,
            monto_total: req.monto_total || 0,
            fecha_servicio: req.fecha_servicio,
            direccion_servicio: req.direccion_servicio || 'Por definir',
            estado: req.estado || 'pendiente_aprobacion',
            creado_en: req.creado_en,
            cliente: clienteData
        };
    }

    cambiarTab(tab: TabType) {
        this.tabActivo.set(tab);
    }

    verDetalles(solicitudId: string) {
        this.router.navigate(['/proveedor/solicitudes', solicitudId]);
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
            message: '¿Estás seguro que deseas rechazar este evento? El cliente será notificado de la cancelación.',
            header: 'Confirmar Rechazo',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'bg-[#523576] hover:bg-[#3a2653] text-white border-none p-2 text-xs rounded-lg',
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

    getStatusLabel(estado: string): string {
        switch (estado) {
            case 'pendiente_aprobacion': return 'Pendiente';
            case 'en_negociacion': return 'En Negociación';
            case 'esperando_anticipo': return 'Esperando Pago';
            case 'reservado': return 'Reservado';
            case 'en_progreso': return 'En Progreso';
            case 'entregado_pendiente_liq': return 'Por Liquidar';
            case 'finalizado': return 'Finalizado';
            case 'rechazada': return 'Rechazada';
            case 'cancelada': return 'Cancelada';
            case 'abandonada': return 'Abandonada';
            default: return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
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

        // Actualizar la solicitud en la lista con el nuevo estado (pendiente de liquidación)
        this.solicitudes.update(list =>
            list.map(s => s.id === solicitud.id ? { ...s, estado: 'entregado_pendiente_liq' as const } : s)
        );

        // Mostrar mensaje de éxito
        this.mensajeExito.set('¡PIN validado! El cliente puede proceder con el pago de liquidación.');
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

    /**
     * 🚫 Confirmar y ejecutar la cancelación de una solicitud
     * Muestra un diálogo para que el proveedor ingrese el motivo de cancelación
     */
    confirmarCancelacion(solicitud: SolicitudProveedor) {
        // Validar que la solicitud no esté en estado finalizado, cancelada o rechazada
        if (['finalizado', 'cancelada', 'rechazada'].includes(solicitud.estado)) {
            this.mensajeError.set('No se puede cancelar una solicitud en este estado');
            setTimeout(() => this.mensajeError.set(''), 3000);
            return;
        }

        let motivoCancelacion = '';

        this.confirmationService.confirm({
            message: `
                <div class="space-y-3">
                    <p class="text-slate-700 font-medium">¿Estás seguro de cancelar el servicio para <strong>${solicitud.cliente_nombre}</strong>?</p>
                    <p class="text-sm text-slate-500">Esta acción notificará al cliente y no se podrá revertir.</p>
                    <div class="mt-4">
                        <label for="motivo-cancelacion" class="block text-sm font-semibold text-slate-700 mb-2">
                            Motivo de cancelación <span class="text-[#523576]">*</span>
                        </label>
                        <textarea 
                            id="motivo-cancelacion" 
                            rows="3"
                            placeholder="Explica brevemente por qué cancelas este servicio..."
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#523576] focus:border-[#523576] text-sm"
                        ></textarea>
                    </div>
                </div>
            `,
            header: '⚠️ Cancelar Servicio',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, cancelar servicio',
            rejectLabel: 'No, mantener',
            acceptButtonStyleClass: 'bg-[#523576] hover:bg-[#3a2653] text-white border-none p-2 text-xs rounded-lg',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: () => {
                // Obtener el motivo del textarea
                const textarea = document.getElementById('motivo-cancelacion') as HTMLTextAreaElement;
                motivoCancelacion = textarea?.value?.trim() || '';

                // Validar que se haya ingresado un motivo
                if (!motivoCancelacion) {
                    this.mensajeError.set('Debes proporcionar un motivo para la cancelación');
                    setTimeout(() => this.mensajeError.set(''), 3000);
                    return;
                }

                // Obtener el ID del usuario actual
                const currentUser = this.auth.currentUser();
                if (!currentUser?.id) {
                    this.mensajeError.set('Error: No se pudo identificar al usuario');
                    setTimeout(() => this.mensajeError.set(''), 3000);
                    return;
                }

                // Ejecutar la cancelación
                this.procesando.set(solicitud.id);

                this.api.cancelarSolicitud(solicitud.id, motivoCancelacion, currentUser.id).subscribe({
                    next: (resultado) => {
                        console.log('✅ Solicitud cancelada:', resultado);

                        // Actualizar la lista local
                        this.solicitudes.update(list =>
                            list.map(s => s.id === solicitud.id ? { ...s, estado: 'cancelada' as const } : s)
                        );

                        this.procesando.set(null);
                        this.mensajeExito.set('Servicio cancelado correctamente');
                        setTimeout(() => this.mensajeExito.set(''), 3000);

                        // Recargar la lista completa para asegurar sincronización
                        this.cargarSolicitudes();
                    },
                    error: (err) => {
                        console.error('❌ Error cancelando solicitud:', err);

                        // Mostrar mensaje de error específico si está disponible
                        const errorMsg = err?.message || 'Error al cancelar el servicio';
                        this.mensajeError.set(errorMsg);
                        setTimeout(() => this.mensajeError.set(''), 5000);

                        this.procesando.set(null);
                    }
                });
            }
        });
    }
}

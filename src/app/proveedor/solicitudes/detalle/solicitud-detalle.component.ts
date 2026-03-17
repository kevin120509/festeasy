import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ServiceRequest, RequestItem, SolicitudEstado } from '../../../models';
import { ConcluirServicioComponent } from '../../concluir-servicio/concluir-servicio';
import { esDiaDelEvento, formatearFechaEvento } from '../../../utils/date.utils';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { FormsModule } from '@angular/forms';
import { ChatNegociacionComponent } from '../../../shared/chat-negociacion/chat-negociacion.component';
import { CotizadorComponent } from '../cotizador/cotizador.component';

@Component({
    selector: 'app-solicitud-detalle',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, RouterModule, ConcluirServicioComponent, ConfirmDialogModule, DialogModule, ButtonModule, RippleModule, FormsModule, ChatNegociacionComponent, CotizadorComponent],
    providers: [ConfirmationService],
    templateUrl: './solicitud-detalle.component.html'
})
export class SolicitudDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ApiService);
    private confirmationService = inject(ConfirmationService);
    public auth = inject(AuthService);

    // Exponer el enum para uso en el template
    public readonly SolicitudEstado = SolicitudEstado;

    solicitud = signal<ServiceRequest | null>(null);
    items = signal<RequestItem[]>([]);
    isLoading = signal(true);
    mensajeError = signal('');
    mensajeExito = signal('');

    // Control del modal de validación de PIN
    mostrarModalPin = signal(false);
    solicitudSeleccionadaId = signal<string>('');
    procesando = signal(false);

    // Control del Modal del Cotizador
    mostrarCotizador = signal(false);

    // 🚫 Control del diálogo de cancelación
    displayCancelDialog: boolean = false;
    motivoTemporal: string = '';
    solicitudACancelar: ServiceRequest | null = null;
    
    tiempoRestanteNegociacion = signal<string | null>(null);
    private timerInterval: any;
    
    // 💳 Control del diálogo de Pago Manual
    mostrarModalPagoManual = signal(false);
    pagoManual = {
        monto: 0,
        metodo_pago: 'efectivo' as 'efectivo' | 'transferencia',
        tipo_pago: 'anticipo' as 'anticipo' | 'liquidacion'
    };

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarDetalle(id);
        } else {
            this.mensajeError.set('No se encontró el ID de la solicitud');
            this.isLoading.set(false);
        }

        this.actualizarTiempoRestante();
        this.timerInterval = setInterval(() => {
            this.actualizarTiempoRestante();
        }, 60000); // 1 minuto
    }

    ngOnDestroy(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    cargarDetalle(id: string): void {
        this.isLoading.set(true);
        this.api.getRequestById(id).subscribe({
            next: (data) => {
                console.log('📌 Detalle de solicitud cargado:', data);
                this.solicitud.set(data);

                // Check if there is a custom package JSON saved
                if (data.cotizacion_borrador && data.cotizacion_borrador.items) {
                    this.items.set(data.cotizacion_borrador.items);
                    this.isLoading.set(false);
                } else {
                    this.cargarItems(id);
                }
            },
            error: (err) => {
                console.error('Error cargando detalle:', err);
                this.mensajeError.set('No se pudo cargar la información del evento');
                this.isLoading.set(false);
            }
        });
    }

    cargarItems(id: string): void {
        this.api.getRequestItems(id).subscribe({
            next: (data) => {
                this.items.set(data);

                // Vincular items a la solicitud para que componentes hijos (ej: Cotizador) puedan leerlos
                const currentSol = this.solicitud();
                if (currentSol) {
                    this.solicitud.set({
                        ...currentSol,
                        items: data
                    });
                }

                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error cargando items:', err);
                this.isLoading.set(false);
            }
        });
    }

    volver(): void {
        this.router.navigate(['/proveedor/solicitudes']);
    }

    formatearFecha(fechaStr: string): string {
        if (!fechaStr) return '';
        // Fix timezone issue by appending time or splitting
        // new Date('2026-01-30') is UTC, so -6h is previous day 18:00
        // new Date('2026-01-30T00:00:00') is Local
        const fecha = new Date(fechaStr + 'T00:00:00');
        return fecha.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getStatusLabel(estado: string | undefined): string {
        if (!estado) return '';
        switch (estado) {
            case 'pendiente_aprobacion': return 'Pendiente';
            case 'en_negociacion': return 'En Negociación';
            case 'esperando_confirmacion_cliente': return 'Esperando Respuesta';
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

    getHora(): string {
        const titulo = this.solicitud()?.titulo_evento || '';
        const match = titulo.match(/\(([^)]+)\)/); // Finds text inside ()
        return match ? match[1] : 'Por definir';
    }

    getInvitados(): string {
        const titulo = this.solicitud()?.titulo_evento || '';
        const match = titulo.match(/- (\d+) invitados/); // Finds "- N invitados"
        return match ? match[1] : 'No especificado';
    }

    getTituloReal(): string {
        let titulo = this.solicitud()?.titulo_evento || '';
        // Remove time
        titulo = titulo.replace(/\s*\([^)]+\)/, '');
        // Remove guests
        titulo = titulo.replace(/\s*-\s*\d+\s*invitados/, '');
        return titulo.trim();
    }

    actualizarTiempoRestante(): void {
        const expiracionStr = this.solicitud()?.expiracion_negociacion;
        if (!expiracionStr || this.solicitud()?.estado !== 'en_negociacion') {
            this.tiempoRestanteNegociacion.set(null);
            return;
        }

        const expiracion = new Date(expiracionStr);
        const ahora = new Date();
        const diffMs = expiracion.getTime() - ahora.getTime();

        if (diffMs <= 0) {
            this.tiempoRestanteNegociacion.set('Expirado');
            return;
        }

        const horas = Math.floor(diffMs / (1000 * 60 * 60));
        const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (horas > 0) {
            this.tiempoRestanteNegociacion.set(`${horas}h ${minutos}m`);
        } else {
            this.tiempoRestanteNegociacion.set(`${minutos}m`);
        }
    }


    /**
     * 🔒 LÓGICA DE PIN
     */
    abrirModalPin() {
        const id = this.solicitud()?.id;
        if (id) {
            this.solicitudSeleccionadaId.set(id);
            this.mostrarModalPin.set(true);
        }
    }

    cerrarModalPin() {
        this.mostrarModalPin.set(false);
    }

    onServicioConcluido(solicitudActualizada: ServiceRequest) {
        console.log('✅ Servicio concluido exitosamente:', solicitudActualizada);
        this.solicitud.set(solicitudActualizada);
        this.mensajeExito.set('¡Entrega registrada! El servicio ha sido marcado como entregado.');
        setTimeout(() => this.mensajeExito.set(''), 4000);
        this.cerrarModalPin();
    }

    esDiaDelEvento(fecha: string | undefined): boolean {
        if (!fecha) return false;
        return esDiaDelEvento(fecha);
    }

    formatearFechaCompleta(fecha: string | undefined): string {
        if (!fecha) return '';
        return formatearFechaEvento(fecha);
    }

    /**
     * ✅ Aceptar solicitud directamente (sin negociar)
     */
    aceptarSolicitud(): void {
        const id = this.solicitud()?.id;
        if (!id || this.procesando()) return;

        this.procesando.set(true);
        this.api.updateSolicitudEstado(id, 'esperando_anticipo').subscribe({
            next: () => {
                this.mensajeExito.set('¡Solicitud aceptada! Se ha notificado al cliente.');
                setTimeout(() => this.mensajeExito.set(''), 3000);
                this.procesando.set(false);
                this.cargarDetalle(id);
            },
            error: (err) => {
                console.error('Error aceptando solicitud:', err);
                this.mensajeError.set('No se pudo aceptar la solicitud');
                setTimeout(() => this.mensajeError.set(''), 3000);
                this.procesando.set(false);
            }
        });
    }

    /**
     * 💬 Iniciar Negociación
     */
    iniciarNegociacion(): void {
        const id = this.solicitud()?.id;
        if (!id || this.procesando()) return;

        this.procesando.set(true);

        // Se calcula la expiración: 24 horas a partir de ahora.
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 24);

        this.api.updateSolicitudEstado(id, 'en_negociacion', {
            expiracion_negociacion: expirationDate.toISOString()
        }).subscribe({
            next: () => {
                this.mensajeExito.set('Negociación iniciada. Ahora puedes chatear y modificar la propuesta.');
                setTimeout(() => this.mensajeExito.set(''), 3000);
                this.procesando.set(false);
                this.cargarDetalle(id);
            },
            error: (err) => {
                console.error('Error iniciando negociación:', err);
                this.mensajeError.set('No se pudo iniciar la negociación');
                setTimeout(() => this.mensajeError.set(''), 3000);
                this.procesando.set(false);
            }
        });
    }

    /**
     * 📤 Enviar Propuesta Finalizada
     */
    enviarPropuestaOficial(propuesta: any): void {
        const id = this.solicitud()?.id;
        if (!id || this.procesando()) return;

        this.procesando.set(true);

        // Limpiamos el tiempo de expiración ya que la negociación concluyó por parte del proveedor
        console.log('Datos de la propuesta a guardar:', propuesta);

        this.api.updateSolicitudEstado(id, 'esperando_confirmacion_cliente', {
            expiracion_negociacion: null,
            cotizacion_borrador: propuesta
        }).subscribe({
            next: () => {
                this.mensajeExito.set('¡Propuesta enviada al cliente!');
                setTimeout(() => this.mensajeExito.set(''), 3000);
                this.procesando.set(false);
                this.cargarDetalle(id);
            },
            error: (err) => {
                console.error('Error enviando propuesta:', err);
                this.mensajeError.set('No se pudo enviar la propuesta');
                setTimeout(() => this.mensajeError.set(''), 3000);
                this.procesando.set(false);
            }
        });
    }

    /**
     * ❌ Rechazar solicitud con confirmación
     */
    rechazarSolicitud(): void {
        const id = this.solicitud()?.id;
        if (!id || this.procesando()) return;

        this.confirmationService.confirm({
            message: '¿Estás seguro que deseas rechazar este evento? El cliente será notificado de la cancelación y no podrá retomar esta solicitud.',
            header: 'Confirmar Rechazo',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, rechazar',
            rejectLabel: 'No, mantener',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: () => {
                this.procesando.set(true);
                this.api.updateSolicitudEstado(id, 'rechazada').subscribe({
                    next: () => {
                        this.mensajeExito.set('Solicitud rechazada');
                        setTimeout(() => this.mensajeExito.set(''), 3000);
                        this.procesando.set(false);
                        this.cargarDetalle(id);
                    },
                    error: (err) => {
                        console.error('Error rechazando solicitud:', err);
                        this.mensajeError.set('No se pudo rechazar la solicitud');
                        setTimeout(() => this.mensajeError.set(''), 3000);
                        this.procesando.set(false);
                    }
                });
            }
        });
    }

    /**
     * 🔄 Refrescar datos de la solicitud
     */
    refrescarDatos(): void {
        const id = this.solicitud()?.id;
        if (id) {
            this.cargarDetalle(id);
            this.mensajeExito.set('Datos actualizados');
            setTimeout(() => this.mensajeExito.set(''), 2000);
        }
    }

    /**
     * 📝 Cotizador
     */
    abrirCotizador() {
        this.mostrarCotizador.set(true);
    }

    cerrarCotizador() {
        this.mostrarCotizador.set(false);
    }

    onCotizacionEnviada() {
        this.mensajeExito.set('Cotización enviada exitosamente');
        setTimeout(() => this.mensajeExito.set(''), 3000);
        this.cerrarCotizador();
        this.refrescarDatos();
    }

    onBorradorGuardado() {
        this.mensajeExito.set('Borrador guardado');
        setTimeout(() => this.mensajeExito.set(''), 3000);
        this.refrescarDatos();
    }


    /**
     * 🚫 Abrir diálogo de cancelación
     */
    confirmarCancelacion(): void {
        const solicitud = this.solicitud();
        if (!solicitud) return;

        // Guardar la solicitud a cancelar y abrir el diálogo
        this.solicitudACancelar = solicitud;
        this.motivoTemporal = '';
        this.displayCancelDialog = true;
    }

    /**
     * 🚫 Ejecutar cancelación final con el motivo ingresado
     */
    ejecutarCancelacionFinal(): void {
        const solicitud = this.solicitudACancelar;

        if (!solicitud) {
            this.displayCancelDialog = false;
            return;
        }

        // Validar que el motivo no esté vacío
        if (!this.motivoTemporal || this.motivoTemporal.trim() === '') {
            this.mensajeError.set('Debes proporcionar un motivo para cancelar el servicio.');
            setTimeout(() => this.mensajeError.set(''), 3000);
            return;
        }

        // Obtener userId del AuthService
        const userId = this.auth.currentUser()?.id;
        if (!userId) {
            this.mensajeError.set('No se pudo obtener la información del usuario.');
            setTimeout(() => this.mensajeError.set(''), 3000);
            this.displayCancelDialog = false;
            return;
        }

        // Llamar al servicio de cancelación
        this.api.cancelarSolicitud(solicitud.id, this.motivoTemporal.trim(), userId).subscribe({
            next: (resultado) => {
                console.log('✅ Servicio cancelado:', resultado);
                this.mensajeExito.set('Servicio cancelado exitosamente');
                setTimeout(() => this.mensajeExito.set(''), 3000);

                // Cerrar diálogo y limpiar
                this.displayCancelDialog = false;
                this.motivoTemporal = '';
                this.solicitudACancelar = null;

                // Recargar datos para reflejar el cambio
                this.refrescarDatos();
            },
            error: (err) => {
                console.error('❌ Error al cancelar:', err);
                this.mensajeError.set(err.error?.message || 'Error al cancelar el servicio');
                setTimeout(() => this.mensajeError.set(''), 4000);
                this.displayCancelDialog = false;
            }
        });
    }

    /**
     * 🚫 Cerrar diálogo de cancelación
     */
    cerrarDialogoCancelacion(): void {
        this.displayCancelDialog = false;
        this.motivoTemporal = '';
        this.solicitudACancelar = null;
    }

    /**
     * 💳 PAGO MANUAL
     */
    abrirModalPagoManual(): void {
        const sol = this.solicitud();
        if (!sol) return;

        // Pre-configurar según estado
        if (sol.estado === 'entregado_pendiente_liq') {
            this.pagoManual.tipo_pago = 'liquidacion';
            this.pagoManual.monto = sol.monto_liquidacion || 0;
        } else {
            this.pagoManual.tipo_pago = 'anticipo';
            this.pagoManual.monto = sol.monto_anticipo || 0;
        }
        
        this.mostrarModalPagoManual.set(true);
    }

    registrarPagoManual(): void {
        const sol = this.solicitud();
        if (!sol || this.procesando()) return;

        this.procesando.set(true);
        const payload = {
            cliente_usuario_id: sol.cliente_usuario_id,
            proveedor_usuario_id: sol.proveedor_usuario_id,
            monto: this.pagoManual.monto,
            metodo_pago: this.pagoManual.metodo_pago,
            estado: 'aprobado',
            solicitud_id: sol.id,
            tipo_pago: this.pagoManual.tipo_pago,
            id_transaccion_externa: 'MANUAL-' + Date.now()
        };

        this.api.createPago(payload).subscribe({
            next: () => {
                // Actualizar estado de la solicitud
                const nuevoEstado = this.pagoManual.tipo_pago === 'anticipo' ? 'reservado' : 'finalizado';
                this.api.updateSolicitudEstado(sol.id, nuevoEstado).subscribe({
                    next: () => {
                        this.mensajeExito.set('Pago registrado y estado actualizado correctamente');
                        setTimeout(() => this.mensajeExito.set(''), 3000);
                        this.mostrarModalPagoManual.set(false);
                        this.refrescarDatos();
                        this.procesando.set(false);
                    },
                    error: (err) => {
                        console.error('Error actualizando estado tras pago manual:', err);
                        this.mensajeError.set('Pago registrado pero no se pudo actualizar el estado');
                        this.procesando.set(false);
                    }
                });
            },
            error: (err) => {
                console.error('Error registrando pago manual:', err);
                this.mensajeError.set('No se pudo registrar el pago manual');
                this.procesando.set(false);
            }
        });
    }
}

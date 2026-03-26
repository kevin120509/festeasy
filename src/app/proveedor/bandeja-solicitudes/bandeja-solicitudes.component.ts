import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ValidarPin } from '../validar-pin/validar-pin';
import { ServiceRequest } from '../../models';
import { esDiaDelEvento, formatearFechaEvento } from '../../utils/date.utils';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

interface SolicitudBandeja {
    id: string;
    numero_solicitud: number;
    cliente_nombre: string;
    cliente_avatar?: string;
    cliente_telefono?: string;
    titulo_evento: string;
    tipo_evento?: string;
    fecha_servicio: string;
    direccion_servicio: string;
    monto_total: number;
    estado: 'pendiente_aprobacion' | 'rechazada' | 'esperando_anticipo' | 'reservado' | 'en_progreso' | 'entregado_pendiente_liq' | 'finalizado' | 'cancelada' | 'abandonada' | 'en_negociacion';
    creado_en: string;
    horas_restantes?: number;
    es_critico?: boolean;
}

type TabType = 'pendientes' | 'en_negociacion' | 'aceptadas' | 'historial';

@Component({
    selector: 'app-bandeja-solicitudes',
    standalone: true,
    imports: [
        CommonModule,
        CurrencyPipe,
        RouterModule,
        ValidarPin,
        ConfirmDialogModule,
        ButtonModule,
        TooltipModule,
        CardModule
    ],
    providers: [ConfirmationService],
    templateUrl: './bandeja-solicitudes.component.html'
})
export class BandejaSolicitudesComponent implements OnInit {
    private auth = inject(AuthService);
    private api = inject(ApiService);
    private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    tabActivo = signal<TabType>('pendientes');
    isLoading = signal(true);
    mensajeExito = signal('');
    mensajeError = signal('');
    procesando = signal<string | null>(null);

    // Control del modal de validación de PIN
    mostrarModalPin = signal(false);
    solicitudSeleccionada = signal<string>('');

    solicitudes = signal<SolicitudBandeja[]>([]);

    // Filtrar solicitudes según el tab activo
    solicitudesFiltradas = computed(() => {
        const tab = this.tabActivo();
        const all = this.solicitudes();
        let filtered: SolicitudBandeja[];

        switch (tab) {
            case 'pendientes':
                filtered = all.filter(s => s.estado === 'pendiente_aprobacion');
                break;
            case 'en_negociacion':
                filtered = all.filter(s => s.estado === 'en_negociacion');
                break;
            case 'aceptadas':
                filtered = all.filter(s => ['esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(s.estado));
                break;
            case 'historial':
                filtered = all.filter(s => ['rechazada', 'finalizado', 'cancelada', 'abandonada'].includes(s.estado));
                break;
            default:
                filtered = all;
        }
        // Ordenar: más recientes arriba
        return filtered.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
    });

    // Contadores para badges
    contadores = computed(() => {
        const all = this.solicitudes();
        return {
            pendientes: all.filter(s => s.estado === 'pendiente_aprobacion').length,
            en_negociacion: all.filter(s => s.estado === 'en_negociacion').length,
            aceptadas: all.filter(s => ['esperando_anticipo', 'reservado', 'en_progreso', 'entregado_pendiente_liq'].includes(s.estado)).length,
            historial: all.filter(s => ['rechazada', 'finalizado', 'cancelada', 'abandonada'].includes(s.estado)).length
        };
    });

    ngOnInit(): void {
        this.cargarSolicitudes();

        // Leer tab desde parámetros de consulta
        this.route.queryParams.subscribe(params => {
            const tab = params['tab'] as TabType;
            if (tab && ['pendientes', 'en_negociacion', 'aceptadas', 'historial'].includes(tab)) {
                this.tabActivo.set(tab);
            }
        });
    }

    cargarSolicitudes(): void {
        this.isLoading.set(true);

        this.api.getProviderRequestsReal().subscribe({
            next: (data) => {
                console.log('📋 Bandeja solicitudes:', data);
                const solicitudesMapeadas = data.map((req: any) => this.mapearSolicitud(req));
                // Ordenar por urgencia (menos tiempo restante primero)
                solicitudesMapeadas.sort((a, b) => (a.horas_restantes || 999) - (b.horas_restantes || 999));
                this.solicitudes.set(solicitudesMapeadas);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error cargando solicitudes:', err);
                this.isLoading.set(false);
            }
        });
    }

    private mapearSolicitud(req: any): SolicitudBandeja {
        const creadoEn = new Date(req.creado_en);
        const ahora = new Date();
        const diffMs = ahora.getTime() - creadoEn.getTime();
        const horasTranscurridas = diffMs / (1000 * 60 * 60);
        const horasRestantes = Math.max(0, 24 - horasTranscurridas);

        const rawCliente = req.cliente || req.perfil_cliente;
        const clienteData = Array.isArray(rawCliente) ? rawCliente[0] : rawCliente;

        // Búsqueda exhaustiva del nombre
        const nombreFinal = clienteData?.nombre_completo ||
            clienteData?.nombre_negocio ||
            clienteData?.nombre ||
            req.cliente_nombre || // Fallback a propiedad directa si existe
            'Cliente';

        return {
            id: req.id,
            numero_solicitud: req.numero_solicitud,
            cliente_nombre: nombreFinal,
            cliente_avatar: clienteData?.avatar_url,
            cliente_telefono: clienteData?.telefono,
            titulo_evento: req.titulo_evento || 'Evento',
            tipo_evento: this.detectarTipoEvento(req.titulo_evento),
            fecha_servicio: req.fecha_servicio,
            direccion_servicio: req.direccion_servicio || 'Por definir',
            monto_total: req.monto_total || 0,
            estado: req.estado || 'pendiente_aprobacion',
            creado_en: req.creado_en,
            horas_restantes: Math.round(horasRestantes * 10) / 10,
            es_critico: horasRestantes <= 6
        };
    }

    private detectarTipoEvento(titulo: string): string {
        if (!titulo) return 'Evento';
        const tituloLower = titulo.toLowerCase();
        if (tituloLower.includes('boda')) return 'Boda';
        if (tituloLower.includes('xv') || tituloLower.includes('quince')) return 'XV Años';
        if (tituloLower.includes('cumple')) return 'Cumpleaños';
        if (tituloLower.includes('bautizo')) return 'Bautizo';
        if (tituloLower.includes('graduación') || tituloLower.includes('graduacion')) return 'Graduación';
        if (tituloLower.includes('corporativo') || tituloLower.includes('empresa')) return 'Corporativo';
        return 'Evento';
    }

    cambiarTab(tab: TabType): void {
        this.tabActivo.set(tab);
    }

    aceptarSolicitud(solicitud: SolicitudBandeja): void {
        if (this.procesando()) return;
        this.procesando.set(solicitud.id);

        this.api.updateSolicitudEstado(solicitud.id, 'esperando_anticipo').subscribe({
            next: () => {
                this.solicitudes.update(list =>
                    list.map(s => s.id === solicitud.id ? { ...s, estado: 'esperando_anticipo' as const } : s)
                );
                this.procesando.set(null);
                this.mensajeExito.set('¡Solicitud aceptada! El cliente recibirá notificación.');
                setTimeout(() => this.mensajeExito.set(''), 4000);
            },
            error: (err) => {
                console.error('Error aceptando solicitud:', err);
                this.mensajeError.set('Error al aceptar la solicitud');
                setTimeout(() => this.mensajeError.set(''), 4000);
                this.procesando.set(null);
            }
        });
    }

    negociarSolicitud(solicitud: SolicitudBandeja): void {
        if (this.procesando()) return;
        this.procesando.set(solicitud.id);

        this.api.updateSolicitudEstado(solicitud.id, 'en_negociacion').subscribe({
            next: () => {
                this.solicitudes.update(list =>
                    list.map(s => s.id === solicitud.id ? { ...s, estado: 'en_negociacion' as const } : s)
                );
                this.procesando.set(null);
                this.router.navigate(['/proveedor/solicitudes', solicitud.id]);
            },
            error: (err) => {
                console.error('Error al poner en negociación:', err);
                this.mensajeError.set('Error al iniciar la negociación');
                setTimeout(() => this.mensajeError.set(''), 4000);
                this.procesando.set(null);
            }
        });
    }

    rechazarSolicitud(solicitud: SolicitudBandeja): void {
        if (this.procesando()) return;

        this.confirmationService.confirm({
            message: '¿Estás seguro que deseas rechazar este evento? El cliente será notificado automáticamente.',
            header: 'Confirmar Rechazo',
            icon: 'pi pi-exclamation-circle',
            acceptLabel: 'Sí, rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'bg-[#523576] hover:bg-[#3a2653] text-white border-none p-2 text-[10px] rounded-lg px-4',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: () => {
                this.procesando.set(solicitud.id);

                this.api.updateSolicitudEstado(solicitud.id, 'rechazada').subscribe({
                    next: () => {
                        this.solicitudes.update(list =>
                            list.map(s => s.id === solicitud.id ? { ...s, estado: 'rechazada' as const } : s)
                        );
                        this.procesando.set(null);
                        this.mensajeExito.set('Solicitud rechazada correctamente');
                        setTimeout(() => this.mensajeExito.set(''), 4000);
                    },
                    error: (err) => {
                        console.error('Error rechazando solicitud:', err);
                        this.mensajeError.set('Error al rechazar la solicitud');
                        setTimeout(() => this.mensajeError.set(''), 4000);
                        this.procesando.set(null);
                    }
                });
            }
        });
    }

    eliminarDelHistorial(solicitud: SolicitudBandeja): void {
        this.confirmationService.confirm({
            message: `¿Deseas eliminar este registro del historial? Esta acción solo lo quitará de tu vista y no afectará al cliente.`,
            header: 'Eliminar del Historial',
            icon: 'pi pi-trash',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Conservar',
            acceptButtonStyleClass: 'bg-[#523576] hover:bg-[#3a2653] text-white border-none p-2 text-[10px] rounded-lg px-4',
            rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
            accept: () => {
                this.procesando.set(solicitud.id);
                // Aquí solo filtramos localmente ya que es "limpiar historial" del proveedor
                // En una app real, podrías llamar a un endpoint de "archivar"
                setTimeout(() => {
                    this.solicitudes.update(list => list.filter(s => s.id !== solicitud.id));
                    this.procesando.set(null);
                    this.mensajeExito.set('Registro eliminado del historial');
                    setTimeout(() => this.mensajeExito.set(''), 3000);
                }, 500);
            }
        });
    }

    formatearTiempoRestante(horas: number | undefined): string {
        if (horas === undefined) return '';
        if (horas <= 0) return 'Tiempo agotado';

        const horasEnteras = Math.floor(horas);
        const minutos = Math.round((horas - horasEnteras) * 60);

        if (horasEnteras >= 1) {
            return `${horasEnteras}h ${minutos}m`;
        }
        return `${minutos}m`;
    }

    formatearFecha(fechaStr: string): string {
        if (!fechaStr) return 'Por definir';
        // Fix timezone issue by appending time or splitting
        // new Date('2026-01-30') is UTC, so -6h is previous day 18:00
        // new Date('2026-01-30T00:00:00') is Local
        const fecha = new Date(fechaStr.includes('T') ? fechaStr : fechaStr + 'T00:00:00');
        const opciones: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };
        return fecha.toLocaleDateString('es-MX', opciones);
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
        setTimeout(() => this.mensajeExito.set(''), 4000);

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

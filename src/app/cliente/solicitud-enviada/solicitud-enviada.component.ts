import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';


@Component({
    selector: 'app-solicitud-enviada',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './solicitud-enviada.component.html'
})
export class SolicitudEnviadaComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private api = inject(ApiService);
    public auth = inject(AuthService);
    private supabaseData = inject(SupabaseDataService);
    private timerInterval: any;

    // Datos de la solicitud enviada
    solicitudData = signal<any>(null);
    loading = signal(true);

    // Contador de 24 horas
    horasRestantes = signal(24);
    minutosRestantes = signal(0);
    segundosRestantes = signal(0);

    // Estado
    tiempoAgotado = signal(false);
    eliminando = signal(false);

    // Estado del proveedor
    providerReplied = signal(false);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            // Primero, si la ruta trae un id, cargar desde la base de datos
            this.loading.set(true);
            this.api.getRequestById(id).subscribe({
                next: (sol: any) => {
                    // Mapear evento/proveedor/items a la forma que espera la vista
                    this.api.getRequestItems(id).subscribe({
                        next: (items: any[]) => {
                            const evento = {
                                titulo_evento: sol.titulo_evento || 'Evento',
                                fecha_servicio: sol.fecha_servicio ? new Date(sol.fecha_servicio).toLocaleDateString('es-MX') : '',
                                hora_servicio: sol.hora_servicio || '',
                                invitados: sol.invitados || 0,
                                ubicacion: sol.direccion_servicio || ''
                            };

                            const paquetes = items.map(it => ({
                                id: it.paquete_id || it.id,
                                nombre: it.nombre_paquete_snapshot || 'Paquete',
                                precioUnitario: it.precio_unitario,
                                cantidad: it.cantidad,
                                subtotal: (it.precio_unitario || 0) * (it.cantidad || 0)
                            }));

                            const rawProv = sol.perfil_proveedor;
                            const proveedor = (Array.isArray(rawProv) ? rawProv[0] : rawProv) || {};

                            const datos = {
                                id: sol.id,
                                fechaEnvio: sol.creado_en || new Date().toISOString(),
                                estado: sol.estado,
                                pin_validacion: sol.pin_validacion,
                                cancelado_por_id: sol.cancelado_por_id,
                                motivo_cancelacion: sol.motivo_cancelacion,
                                fecha_cancelacion: sol.fecha_cancelacion,
                                evento,
                                proveedor: {
                                    nombre: proveedor.nombre_negocio || proveedor.nombre || 'Proveedor',
                                    imagen: proveedor.avatar_url || null,
                                    ubicacion: proveedor.direccion_formato || null,
                                    rating: proveedor.rating || 4.5
                                },
                                paquetesSeleccionados: paquetes as any[],
                                total: sol.monto_total || paquetes.reduce((s, a) => s + (a.subtotal || 0), 0)
                            };

                            this.solicitudData.set(datos);

                            // Check status logic
                            if (sol.estado !== 'pendiente_aprobacion') {
                                this.providerReplied.set(true);
                                this.horasRestantes.set(0);
                                this.minutosRestantes.set(0);
                                this.segundosRestantes.set(0);
                            } else {
                                const fechaExpiracion = new Date(new Date(datos.fechaEnvio).getTime() + 24 * 60 * 60 * 1000);
                                this.iniciarContador(fechaExpiracion);
                            }

                            this.loading.set(false);
                        },
                        error: (err) => {
                            console.error('Error cargando items de solicitud:', err);
                            this.loading.set(false);
                            this.router.navigate(['/cliente/solicitudes']);
                        }
                    });
                },
                error: (err) => {
                    console.error('Error cargando solicitud:', err);
                    this.loading.set(false);
                    this.router.navigate(['/cliente/solicitudes']);
                }
            });
            return;
        } else {
            // Cargar desde SessionStorage (flujo de creación)
            const solicitudGuardada = sessionStorage.getItem('solicitudEnviada');
            if (solicitudGuardada) {
                const data = JSON.parse(solicitudGuardada);
                this.solicitudData.set(data);
                this.loading.set(false);

                // Calcular tiempo restante desde el momento del envío
                const fechaEnvio = new Date(data.fechaEnvio);
                const fechaExpiracion = new Date(fechaEnvio.getTime() + 24 * 60 * 60 * 1000); // +24 horas
                this.iniciarContador(fechaExpiracion);
            } else {
                // Si no hay datos, redirigir a solicitudes
                this.router.navigate(['/cliente/solicitudes']);
            }
        }
    }

    ngOnDestroy(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    iniciarContador(fechaExpiracion: Date) {
        this.actualizarTiempo(fechaExpiracion);

        this.timerInterval = setInterval(() => {
            this.actualizarTiempo(fechaExpiracion);
        }, 1000);
    }

    actualizarTiempo(fechaExpiracion: Date) {
        const ahora = new Date();
        const diferencia = fechaExpiracion.getTime() - ahora.getTime();

        if (diferencia <= 0) {
            this.tiempoAgotado.set(true);
            this.horasRestantes.set(0);
            this.minutosRestantes.set(0);
            this.segundosRestantes.set(0);
            clearInterval(this.timerInterval);
            return;
        }

        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        this.horasRestantes.set(horas);
        this.minutosRestantes.set(minutos);
        this.segundosRestantes.set(segundos);
    }

    verMisSolicitudes() {
        // Limpiar datos temporales
        sessionStorage.removeItem('solicitudEnviada');
        sessionStorage.removeItem('eventoActual');
        this.router.navigate(['/cliente/solicitudes']);
    }

    crearOtroEvento() {
        sessionStorage.removeItem('solicitudEnviada');
        sessionStorage.removeItem('eventoActual');
        this.router.navigate(['/cliente/solicitudes/crear']);
    }

    irAPagar() {
        const id = this.solicitudData().id;
        this.router.navigate(['/cliente/pago', id]);
    }

    irAPagarLiquidacion() {
        const id = this.solicitudData().id;
        this.router.navigate(['/cliente/pago', id]);
    }

    calcularLiquidacion(): number {
        const data = this.solicitudData();
        if (!data) return 0;
        // Si hay monto_liquidacion definido, usarlo, sino calcular el 70%
        return data.monto_liquidacion || Math.round((data.total || 0) * 0.7);
    }

    puedeEliminar(): boolean {
        const data = this.solicitudData();
        if (!data) return false;
        return !this.providerReplied() && (data.estado === 'pendiente_aprobacion' || data.estado === 'pendiente');
    }

    async eliminarSolicitud() {
        const data = this.solicitudData();
        if (!data || !this.puedeEliminar() || this.eliminando()) return;

        const confirmar = window.confirm('¿Deseas eliminar esta solicitud? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        this.eliminando.set(true);
        try {
            await this.supabaseData.deleteRequestById(data.id);
            sessionStorage.removeItem('solicitudEnviada');
            sessionStorage.removeItem('eventoActual');
            this.router.navigate(['/cliente/solicitudes']);
        } catch (error: any) {
            console.error('Error eliminando solicitud:', error);
            alert(error?.message || 'No se pudo eliminar la solicitud. Intenta de nuevo.');
        } finally {
            this.eliminando.set(false);
        }
    }
}
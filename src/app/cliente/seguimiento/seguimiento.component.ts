import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
    esDiaDelEvento,
    faltanTresHorasParaEvento,
    formatearFechaEvento,
    guardarPinEnLocalStorage,
    obtenerPinAlmacenado
} from '../../utils/date.utils';


@Component({
    selector: 'app-seguimiento-evento',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './seguimiento.component.html',
    styleUrl: './seguimiento.component.css'
})
export class SeguimientoEventoComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    public api = inject(ApiService);

    loading = signal(true);
    evento = signal<any>(null);
    items = signal<any[]>([]);

    // Countdown signals
    diasRestantes = signal(0);
    horasRestantes = signal(0);
    private timer: any;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarDetalles(id);
        }
    }

    cargarDetalles(id: string) {
        this.loading.set(true);
        forkJoin({
            evento: this.api.getRequestById(id),
            items: this.api.getRequestItems(id)
        }).subscribe({
            next: ({ evento, items }) => {
                console.log('✅ Detalles de Seguimiento Cargados:', { evento, items });

                if (!evento) {
                    throw new Error('No se encontró la solicitud.');
                }

                // Si no hay items en items_solicitud, intentar fallback a paquetes del proveedor
                if (!items || items.length === 0) {
                    console.warn(`⚠️ No se encontraron paquetes para la solicitud ${id}. Intentando fallback a paquetes del proveedor...`);
                    const providerProfile = evento.perfil_proveedor || (evento.proveedor ? evento.proveedor : null);
                    const providerUserId = providerProfile?.usuario_id || providerProfile?.id || evento.proveedor_usuario_id;

                    if (providerUserId) {
                        this.api.getPackagesByProviderId(providerUserId).subscribe({
                            next: (pkgs: any[]) => {
                                console.log('🔁 Paquetes fallback desde proveedor:', pkgs);
                                const fallbackItems = (pkgs || []).map(p => ({
                                    id: p.id,
                                    paquete_id: p.id,
                                    nombre_paquete_snapshot: p.nombre || 'Paquete',
                                    cantidad: 1,
                                    precio_unitario: p.precio_base || 0
                                }));

                                this.evento.set(evento);
                                this.items.set(fallbackItems);
                                this.iniciarCountdown(evento.fecha_servicio);
                                this.loading.set(false);
                            },
                            error: (err) => {
                                console.error('❌ Error obteniendo paquetes del proveedor para fallback:', err);
                                this.evento.set(evento);
                                this.items.set([]);
                                this.loading.set(false);
                            }
                        });
                        return; // No continuar, el fallback manejará el set
                    }
                }

                this.evento.set(evento);
                this.items.set(items);
                this.iniciarCountdown(evento.fecha_servicio);
                this.loading.set(false);

                // 🔍 DEBUG: Verificar datos del PIN
                console.log('📌 DEBUG PIN - Estado:', evento.estado);
                console.log('📌 DEBUG PIN - pin_validacion:', evento.pin_validacion);
                console.log('📌 DEBUG PIN - Datos completos de la solicitud:', evento);
            },
            error: (err) => {
                console.error('❌ Error fatal cargando detalles del evento:', err);
                this.loading.set(false);
                this.evento.set(null); // Asegurarse de que no se muestren datos viejos
            }
        });
    }

    iniciarCountdown(fechaStr: string) {
        const target = new Date(fechaStr).getTime();

        this.actualizarTiempo(target);
        this.timer = setInterval(() => this.actualizarTiempo(target), 1000 * 60); // Update every minute

        // Verificar si faltan 3 horas para el evento (para notificaciones)
        this.verificarNotificacionTresHoras(fechaStr);
    }

    actualizarTiempo(target: number) {
        const now = new Date().getTime();
        const diff = target - now;

        if (diff > 0) {
            this.diasRestantes.set(Math.floor(diff / (1000 * 60 * 60 * 24)));
            this.horasRestantes.set(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        } else {
            this.diasRestantes.set(0);
            this.horasRestantes.set(0);
        }
    }

    /**
     * 🔒 LÓGICA DE ACTIVACIÓN: Verifica si hoy es el día del evento
     * Esta función se usa en el template para mostrar/ocultar el PIN
     */
    esDiaDelEvento(fechaServicio: string): boolean {
        const resultado = esDiaDelEvento(fechaServicio);

        // Si es el día del evento y hay PIN, guardarlo en localStorage
        if (resultado) {
            const evento = this.evento();
            if (evento?.pin_validacion && evento?.id) {
                guardarPinEnLocalStorage(evento.id, evento.pin_validacion);
            }
        }

        return resultado;
    }

    /**
     * 📅 Formatea la fecha del evento para mostrar al usuario
     */
    formatearFecha(fechaServicio: string): string {
        return formatearFechaEvento(fechaServicio);
    }

    /**
     * 🔔 NOTIFICACIÓN: Verifica si faltan 3 horas para el evento
     * Emite log para preparar envío de notificación al cliente
     */
    private verificarNotificacionTresHoras(fechaServicio: string): void {
        if (faltanTresHorasParaEvento(fechaServicio)) {
            console.log(`🔔 Notificación lista para enviar al cliente: Tu PIN ya está disponible`);
            console.log(`📅 Evento programado para: ${formatearFechaEvento(fechaServicio)}`);

            // TODO: Aquí se puede implementar la integración con servicio de notificaciones
            // Por ejemplo: this.notificationService.enviarNotificacionPin(clienteId);
        }
    }

    /**
     * 💾 Obtiene el PIN del localStorage (para acceso offline)
     */
    obtenerPinGuardado(): string | null {
        const evento = this.evento();
        if (!evento?.id) return null;
        return obtenerPinAlmacenado(evento.id);
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }
}
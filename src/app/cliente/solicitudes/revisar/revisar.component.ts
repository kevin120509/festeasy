import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { CalendarioFechaService } from '../../../services/calendario-fecha.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-revisar-solicitud',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './revisar.html'
})
export class RevisarSolicitudComponent implements OnInit {
    private router = inject(Router);
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private calService = inject(CalendarioFechaService);

    evento = signal<any>(null);
    proveedor = signal<any>(null);
    paquetes = signal<any[]>([]);
    total = signal<number>(0);
    isLoading = signal<boolean>(false);
    notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);

    ngOnInit() {
        // Cargar datos de sessionStorage
        const eventoStr = sessionStorage.getItem('eventoActual');
        const paquetesStr = sessionStorage.getItem('paquetesSeleccionados');
        const proveedorStr = sessionStorage.getItem('proveedorActual');

        if (!eventoStr || !paquetesStr || !proveedorStr) {
            // Si falta información, regresar al inicio del flujo
            this.router.navigate(['/cliente/solicitudes/crear']);
            return;
        }

        this.evento.set(JSON.parse(eventoStr));
        this.proveedor.set(JSON.parse(proveedorStr));

        const pkgs = JSON.parse(paquetesStr);
        this.paquetes.set(pkgs);

        // Calcular total
        const totalAmount = pkgs.reduce((acc: number, curr: any) => acc + (curr.subtotal || 0), 0);
        this.total.set(totalAmount);
    }

    async enviarSolicitud() {
        if (this.isLoading()) return;
        this.isLoading.set(true);
        const userSignal = this.auth.currentUser();
        const user = typeof userSignal === 'function' ? userSignal() : userSignal;
        if (!user) {
            this.notification.set({ message: 'Debes iniciar sesión para continuar', type: 'error' });
            setTimeout(() => this.router.navigate(['/login']), 2500);
            return;
        }

        try {
            const eventoData = this.evento();
            const proveedorData = this.proveedor();
            const fechaServicio = new Date(eventoData.fecha + 'T' + (eventoData.hora || '12:00'));

            // 1. Validar Disponibilidad (Regla 1 y 2)
            const disp = await firstValueFrom(this.calService.consultarDisponibilidad(proveedorData.usuario_id, fechaServicio));
            if (!disp.disponible) {
                this.notification.set({ message: disp.error || 'El proveedor no está disponible para esa fecha.', type: 'error' });
                this.isLoading.set(false);
                return;
            }

            // 2. Calcular SLA (Regla 3)
            const sla = this.calService.aplicarReglaSLA(eventoData.fecha + 'T' + (eventoData.hora || '12:00'));

            // 3. Crear la solicitud con SLA
            const solicitudPayload = {
                cliente_usuario_id: user.id,
                proveedor_usuario_id: proveedorData.usuario_id,
                fecha_servicio: eventoData.fecha,
                direccion_servicio: eventoData.ubicacion,
                titulo_evento: eventoData.titulo,
                monto_total: this.total(),
                estado: 'pendiente_aprobacion',
                latitud_servicio: 0,
                longitud_servicio: 0,
                horas_respuesta_max: sla.horas_respuesta_max,
                es_urgente: sla.es_urgente
            };
            const solicitud = await firstValueFrom(this.api.createRequest(solicitudPayload));
            if (!solicitud?.id) throw new Error('No se pudo crear la solicitud (sin id).');

            // 2. Crear los items de la solicitud
            const itemsPayload = this.paquetes().map(pkg => ({
                solicitud_id: solicitud.id,
                paquete_id: pkg.id,
                nombre_paquete_snapshot: pkg.nombre,
                cantidad: pkg.cantidad,
                precio_unitario: pkg.precio_base
            }));

            const createdItems = await firstValueFrom(this.api.createSolicitudItems(itemsPayload));
            console.log('🔔 Items creados en BD (respuesta insert):', createdItems);

            // Precalcular los paquetes a mostrar desde lo local (fallback si DB no devuelve items)
            let finalPaquetes: any[] = this.paquetes().map((pkg: any) => ({
                id: pkg.id,
                nombre: pkg.nombre || pkg.titulo || pkg.nombre_paquete || pkg.nombre_paquete_snapshot,
                precioUnitario: pkg.precio_base ?? pkg.precioUnitario ?? pkg.precio_unitario_momento,
                subtotal: pkg.subtotal ?? (pkg.cantidad ? (pkg.cantidad * (pkg.precio_base ?? 0)) : 0),
                cantidad: pkg.cantidad ?? 1
            }));

            // Verificamos leyendo directamente de la BD los items de la solicitud recién creada
            try {
                const itemsFromDb = await firstValueFrom(this.api.getRequestItems(solicitud.id));
                console.log('🔎 Items leídos desde BD para solicitud', solicitud.id, itemsFromDb);

                if (itemsFromDb && itemsFromDb.length > 0) {
                    finalPaquetes = itemsFromDb.map((it: any) => ({
                        id: it.paquete_id || it.id,
                        nombre: it.nombre_paquete_snapshot || it.nombre || 'Paquete',
                        precioUnitario: it.precio_unitario,
                        subtotal: (it.precio_unitario || 0) * (it.cantidad || 1),
                        cantidad: it.cantidad || 1
                    }));
                }
            } catch (err) {
                console.error('❌ Error leyendo items desde BD después de insertar:', err);
            }

            // 3. Preparar datos para la pantalla de confirmación
            const fechaRaw = solicitud?.fecha_servicio || eventoData.fecha || eventoData.fecha_servicio || '';
            const horaRaw = solicitud?.hora_servicio || eventoData.hora || eventoData.hora_servicio || '';
            const fechaDisplay = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-MX') : '';

            const eventoParaMostrar = {
                titulo_evento: solicitud?.titulo_evento || eventoData.titulo || eventoData.titulo_evento || 'Evento',
                fecha_servicio: fechaDisplay,
                hora_servicio: horaRaw || '',
                invitados: solicitud?.invitados ?? eventoData.invitados ?? 0,
                ubicacion: solicitud?.direccion_servicio || eventoData.ubicacion,
                descripcion: solicitud?.descripcion || eventoData.descripcion || ''
            };

            const datosConfirmacion = {
                id: solicitud.id,
                fechaEnvio: new Date().toISOString(),
                evento: eventoParaMostrar,
                proveedor: proveedorData,
                paquetesSeleccionados: finalPaquetes,
                total: finalPaquetes.reduce((acc: number, p: any) => acc + (p.subtotal || 0), 0) || this.total()
            };

            console.log('Confirmación solicitud:', { datosConfirmacion, solicitud });
            sessionStorage.setItem('solicitudEnviada', JSON.stringify(datosConfirmacion));

            // 4. Navegar a confirmación
            this.router.navigate(['/cliente/solicitud-enviada']);

        } catch (error: any) {
            console.error('Error al enviar solicitud:', error);
            this.notification.set({ message: 'Ocurrió un error al enviar la solicitud: ' + (error.message || 'Inténtalo de nuevo.'), type: 'error' });
        } finally {
            this.isLoading.set(false);
        }
    }

    volver() {
        window.history.back();
    }
}
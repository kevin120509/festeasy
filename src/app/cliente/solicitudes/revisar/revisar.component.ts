import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { SolicitudDataService } from '../../../services/solicitud-data.service';
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
    private solicitudDataService = inject(SolicitudDataService);

    evento = signal<any>(null);
    proveedor = signal<any>(null);
    paquetes = signal<any[]>([]);
    total = signal<number>(0);
    isLoading = signal<boolean>(false);
    notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);

    objectKeys = Object.keys;

    ngOnInit() {
        // Cargar datos desde el servicio
        const ev = this.solicitudDataService.getEventoActual();
        const pkgs = this.solicitudDataService.getPaquetesSeleccionados();
        const prov = this.solicitudDataService.getProveedorActual();

        console.log('🧐 RevisarSolicitud: Validando datos:', {
            evento: !!ev,
            paquetes: pkgs?.length,
            proveedor: !!prov
        });

        if (!ev || !pkgs || pkgs.length === 0 || !prov) {
            console.warn('⚠️ RevisarSolicitud: Datos incompletos detectados.', { hasEvento: !!ev, packageCount: pkgs?.length, hasProveedor: !!prov });

            if (!ev) {
                console.error('❌ No hay evento configurado, regresando a crear evento.');
                this.router.navigate(['/cliente/solicitudes/crear']);
                return;
            }

            if (!prov || !pkgs || pkgs.length === 0) {
                console.error('❌ No hay proveedor o paquetes seleccionados, regresando al marketplace.');
                this.router.navigate(['/marketplace']);
                return;
            }
        }

        this.evento.set(ev);
        this.proveedor.set(prov);
        this.paquetes.set(pkgs);

        // Calcular total
        const totalAmount = pkgs.reduce((acc: number, curr: any) => {
            const packageTotal = curr.subtotal || 0;
            const incluidosTotal = (curr.incluidos || []).reduce((inclAcc: number, incl: any) => inclAcc + (incl.subtotal || 0), 0);
            return acc + packageTotal + incluidosTotal;
        }, 0);
        this.total.set(totalAmount);
    }

    agregarAlCarrito() {
        const proveedorActual = this.proveedor();

        const solicitud = {
            id: Date.now(), // Temporary ID
            evento: this.evento(),
            proveedor: proveedorActual,
            paquetes: this.paquetes(),
            total: this.total(),
            estado: 'pendiente_por_mandar'
        };

        const agregado = this.solicitudDataService.agregarAlCarrito(solicitud);

        if (!agregado) {
            this.notification.set({ message: 'Esta solicitud ya está en tu carrito para esa fecha.', type: 'error' });
            return;
        }

        this.notification.set({ message: 'Solicitud agregada al carrito', type: 'success' });

        setTimeout(() => {
            this.router.navigate(['/cliente/carrito']);
        }, 1500);
    }

    async enviarSolicitud() {
        console.log('按钮点击: enviarSolicitud (RevisarSolicitudComponent)');
        if (this.isLoading()) {
            console.warn('⚠️ enviarSolicitud bloqueado: isLoading es true');
            return;
        }
        this.isLoading.set(true);
        const userValue = this.auth.currentUser();
        console.log('👤 RevisarSolicitud: Estado del usuario:', !!userValue, userValue?.id);
        const user = userValue;
        if (!user) {
            this.notification.set({ message: 'Debes iniciar sesión para continuar', type: 'error' });
            setTimeout(() => this.router.navigate(['/login']), 2500);
            return;
        }

        try {
            // Asegurar que el usuario tenga un perfil de cliente (previene error de FK)
            await this.auth.ensureClientProfile();

            const eventoData = this.evento();
            const proveedorData = this.proveedor();
            const fechaServicio = new Date(eventoData.fecha + 'T' + (eventoData.horaInicio || '12:00'));

            // Construir título con horario e invitados
            const horarioStr = eventoData.horaInicio ? `(${eventoData.horaInicio})` : '';

            const invitadosStr = eventoData.invitados ? ` - ${eventoData.invitados} invitados` : '';

            const tituloCompleto = `${eventoData.titulo} ${horarioStr}${invitadosStr}`;

            // 3. Crear la solicitud
            const solicitudPayload = {
                cliente_usuario_id: user.id,
                proveedor_usuario_id: proveedorData.usuario_id,
                fecha_servicio: eventoData.fecha,
                direccion_servicio: eventoData.ubicacion || 'Sin dirección',
                titulo_evento: tituloCompleto,
                monto_total: this.total(),
                estado: 'pendiente_aprobacion',
                latitud_servicio: eventoData.coords?.lat || 0,
                longitud_servicio: eventoData.coords?.lng || 0
            };

            console.log('📝 RevisarSolicitud: Iniciando proceso de envío. Payload:', solicitudPayload);

            if (!solicitudPayload.proveedor_usuario_id) {
                console.error('❌ Error: El proveedor no tiene un ID de usuario válido:', proveedorData);
                throw new Error('No se pudo identificar al proveedor. Por favor, selecciona otro.');
            }
            const solicitud = await firstValueFrom(this.api.createRequest(solicitudPayload));
            if (!solicitud?.id) throw new Error('No se pudo crear la solicitud (sin id).');

            // 2. Crear los items de la solicitud
            const itemsPayload = this.paquetes().map(pkg => {
                const incluidosTotal = (pkg.incluidos || []).reduce((acc: number, incl: any) => acc + (incl.subtotal || 0), 0);

                // Extra variant price logic is already added to pkg.subtotal in client side
                let totalVariantesExtra = 0;
                if (pkg.variantes_seleccionadas) {
                    Object.keys(pkg.variantes_seleccionadas).forEach(k => {
                        if (pkg.variantes_seleccionadas[k].extra) {
                            totalVariantesExtra += pkg.variantes_seleccionadas[k].extra;
                        }
                    });
                }
                const precioTotalUnitario = pkg.precio_base + totalVariantesExtra + (incluidosTotal / pkg.cantidad);

                const incluidosSnapshot = (pkg.incluidos || []).map((incl: any) => `\n- ${incl.nombre} (x${incl.cantidad})`).join('');

                // Add variants to snapshot string
                let variantesSnapshot = '';
                if (pkg.variantes_seleccionadas && Object.keys(pkg.variantes_seleccionadas).length > 0) {
                    variantesSnapshot = '\nOpciones:';
                    Object.keys(pkg.variantes_seleccionadas).forEach(k => {
                        const vals = pkg.variantes_seleccionadas[k].valores.join(', ');
                        variantesSnapshot += `\n- ${k}: ${vals}`;
                    });
                }

                const nombreSnapshot = pkg.nombre + (incluidosSnapshot ? `\nIncluye:${incluidosSnapshot}` : '') + variantesSnapshot;

                return {
                    solicitud_id: solicitud.id,
                    paquete_id: pkg.id,
                    nombre_paquete_snapshot: nombreSnapshot,
                    cantidad: pkg.cantidad,
                    precio_unitario: precioTotalUnitario
                };
            });

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
            const horaRaw = horarioStr.trim().replace(/^\(|\)$/g, ''); // Extract "XX:XX - YY:YY" from "(XX:XX - YY:YY)"
            const fechaDisplay = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-MX') : '';

            const eventoParaMostrar = {
                titulo_evento: solicitud?.titulo_evento || tituloCompleto,
                fecha_servicio: fechaDisplay,
                hora_servicio: horaRaw,
                invitados: eventoData.invitados ?? 0,
                ubicacion: solicitud?.direccion_servicio || eventoData.ubicacion,
                descripcion: solicitud?.descripcion || eventoData.descripcion || ''
            };

            const datosConfirmacion = {
                id: solicitud.id,
                fechaEnvio: new Date().toISOString(),
                evento: eventoParaMostrar,
                proveedor: {
                    nombre: proveedorData.nombre_negocio || proveedorData.nombre || 'Proveedor',
                    nombre_negocio: proveedorData.nombre_negocio,
                    imagen: proveedorData.avatar_url || null,
                    ubicacion: proveedorData.direccion_formato || null,
                    rating: proveedorData.rating || 4.5,
                    usuario_id: proveedorData.usuario_id
                },
                paquetesSeleccionados: finalPaquetes,
                total: finalPaquetes.reduce((acc: number, p: any) => acc + (p.subtotal || 0), 0) || this.total()
            };

            console.log('Confirmación solicitud:', { datosConfirmacion, solicitud });
            sessionStorage.setItem('solicitudEnviada', JSON.stringify(datosConfirmacion));

            // Si estaba en el carrito, eliminarla (evita duplicados y limpia el estado)
            this.solicitudDataService.removerPorProveedor(proveedorData.usuario_id);

            // Limpiar el borrador actual ya que se ha enviado exitosamente
            this.solicitudDataService.limpiarBorrador();

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
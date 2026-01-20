import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { HeaderComponent } from '../../../shared/header/header';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-revisar-solicitud',
    standalone: true,
    imports: [CommonModule, HeaderComponent],
    templateUrl: './revisar.html'
})
export class RevisarSolicitudComponent implements OnInit {
    private router = inject(Router);
    private api = inject(ApiService);
    private auth = inject(AuthService);

    evento = signal<any>(null);
    proveedor = signal<any>(null);
    paquetes = signal<any[]>([]);
    total = signal<number>(0);
    isLoading = signal<boolean>(false);

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
            alert('Debes iniciar sesión para continuar');
            this.router.navigate(['/login']);
            return;
        }

        try {
            const eventoData = this.evento();
            const proveedorData = this.proveedor();
            // 1. Crear la solicitud
            const solicitudPayload = {
                cliente_usuario_id: user.id,
                proveedor_usuario_id: proveedorData.usuario_id,
                fecha_servicio: eventoData.fecha,
                direccion_servicio: eventoData.ubicacion,
                titulo_evento: eventoData.titulo,
                monto_total: this.total(),
                estado: 'pendiente_aprobacion',
                latitud_servicio: 0, 
                longitud_servicio: 0
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

            await firstValueFrom(this.api.createSolicitudItems(itemsPayload));

            // 3. Preparar datos para la pantalla de confirmación
            // Mapear campos para que la pantalla `solicitud-enviada` encuentre las propiedades esperadas
            // Normalizar y garantizar valores legibles
            // Preferir valores retornados desde la base de datos (solicitud) cuando existan
            const fechaRaw = solicitud?.fecha_servicio || eventoData.fecha || eventoData.fecha_servicio || '';
            const horaRaw = solicitud?.hora_servicio || eventoData.hora || eventoData.hora_servicio || '';
            const fechaDisplay = fechaRaw ? new Date(fechaRaw).toLocaleDateString('es-MX') : '';
            const horaDisplay = horaRaw || '';

            const eventoParaMostrar = {
                titulo_evento: solicitud?.titulo_evento || eventoData.titulo || eventoData.titulo_evento || 'Evento',
                fecha_servicio: fechaDisplay,
                hora_servicio: horaDisplay,
                invitados: solicitud?.invitados ?? eventoData.invitados ?? eventoData.invitados_estimados ?? 0,
                ubicacion: solicitud?.direccion_servicio || eventoData.ubicacion,
                descripcion: solicitud?.descripcion || eventoData.descripcion || ''
            };

            const paquetesParaMostrar = this.paquetes().map((pkg: any) => ({
                id: pkg.id,
                nombre: pkg.nombre || pkg.titulo || pkg.nombre_paquete || pkg.nombre_paquete_snapshot,
                precioUnitario: pkg.precio_base ?? pkg.precioUnitario ?? pkg.precio_unitario_momento,
                subtotal: pkg.subtotal ?? (pkg.cantidad ? (pkg.cantidad * (pkg.precio_base ?? 0)) : 0),
                cantidad: pkg.cantidad ?? 1
            }));

            const datosConfirmacion = {
                id: solicitud.id,
                fechaEnvio: new Date().toISOString(),
                evento: eventoParaMostrar,
                proveedor: proveedorData,
                paquetesSeleccionados: paquetesParaMostrar,
                total: this.total()
            };
            
            console.log('Confirmación solicitud:', { datosConfirmacion, solicitud });
            sessionStorage.setItem('solicitudEnviada', JSON.stringify(datosConfirmacion));
            
            // 4. Navegar a confirmación
            this.router.navigate(['/cliente/solicitud-enviada']);

        } catch (error: any) {
            console.error('Error al enviar solicitud:', error);
            alert('Ocurrió un error al enviar la solicitud: ' + (error.message || 'Inténtalo de nuevo.'));
        } finally {
            this.isLoading.set(false);
        }
    }

    volver() {
        window.history.back();
    }
}
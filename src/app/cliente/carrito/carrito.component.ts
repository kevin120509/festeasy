import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CalendarioFechaService } from '../../services/calendario-fecha.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule],
    templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private calService = inject(CalendarioFechaService);

    currentStep = signal(1); // 1: Carrito, 2: Checkout

    items = signal<any[]>([]);

    // Request info for checkout - ahora editable
    fechaEvento = signal('');
    horaEvento = signal('');
    direccionEvento = signal('');
    latitud = signal<number | null>(null);
    longitud = signal<number | null>(null);
    ubicacionExacta = signal(false);
    cargandoUbicacion = signal(false);
    enviandoSolicitud = signal(false);

    ngOnInit(): void {
        this.loadCart();
    }

    loadCart() {
        console.log('🛒 CarritoComponent: Cargando carrito...');
        this.api.getCart().subscribe({
            next: (cart) => {
                console.log('🛒 CarritoComponent: Carrito recibido:', cart);
                const mappedItems = (cart?.items || []).map((item: any) => {
                    console.log('🛒 Item del carrito:', item);
                    return {
                        id: item.id,
                        nombre: item.paquete?.nombre || 'Nombre no disponible',
                        paquete_proveedor_id: item.paquete?.proveedor_usuario_id,
                        proveedor: 'Proveedor', // Simplificado - no hay FK a perfil_proveedor
                        precio: item.precio_unitario_momento,
                        cantidad: item.cantidad,
                        imagen: item.paquete?.detalles_json?.imagenes?.[0]?.url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=60'
                    };
                });
                console.log('🛒 Items mapeados:', mappedItems);
                this.items.set(mappedItems);
            },
            error: (err) => {
                console.error('❌ Error cargando carrito:', err);
                this.items.set([]);
            }
        });
    }

    // Obtener ubicación exacta del dispositivo
    obtenerUbicacionExacta() {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización');
            return;
        }

        this.cargandoUbicacion.set(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.latitud.set(position.coords.latitude);
                this.longitud.set(position.coords.longitude);
                this.ubicacionExacta.set(true);
                this.cargandoUbicacion.set(false);

                // Reverse geocoding para obtener dirección
                this.obtenerDireccionDesdeCoordenadas(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                this.cargandoUbicacion.set(false);
                alert('No se pudo obtener tu ubicación. Por favor ingresa la dirección manualmente.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    private async obtenerDireccionDesdeCoordenadas(lat: number, lng: number) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data.display_name) {
                this.direccionEvento.set(data.display_name);
            }
        } catch (error) {
            console.error('Error en reverse geocoding:', error);
        }
    }

    get subtotal() {
        return this.items().reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    get comision() {
        return this.subtotal * 0.05;
    }

    get impuestos() {
        return this.subtotal * 0.07;
    }

    get total() {
        return this.subtotal + this.comision + this.impuestos;
    }

    removeItem(id: string) {
        this.api.deleteCartItem(id.toString()).subscribe(() => {
            this.items.update(items => items.filter(i => i.id !== id));
        });
    }

    proceedToCheckout() {
        this.currentStep.set(2);
        window.scrollTo(0, 0);
    }

    // Validar formulario antes de enviar
    get formularioValido(): boolean {
        return !!(this.fechaEvento() && this.horaEvento() && this.direccionEvento() && this.items().length > 0);
    }

    // Confirmar reservación (sin pago - solo solicitud al proveedor)
    async confirmarReservacion() {
        if (!this.formularioValido) {
            alert('Por favor completa todos los campos del evento');
            return;
        }

        const fechaServicioStr = this.fechaEvento() + 'T' + (this.horaEvento() || '12:00');
        const fechaServicioDate = new Date(fechaServicioStr);

        // Validar primero si la fecha es futura
        if (!this.calService.validarFechaFutura(fechaServicioDate)) {
            alert('No puedes agendar eventos en el pasado.');
            return;
        }

        this.enviandoSolicitud.set(true);

        try {
            const { data: { user } } = await this.api.getCurrentUser();

            if (!user) {
                alert('Debes iniciar sesión (Sesión expirada)');
                this.router.navigate(['/login']);
                return;
            }

            // Calcular SLA una vez para todas las solicitudes
            const sla = this.calService.aplicarReglaSLA(fechaServicioStr);

            // Crear solicitud para cada item del carrito
            for (const item of this.items()) {
                const proveedorId = item.paquete_proveedor_id || item.paquete?.proveedor_usuario_id;

                if (!proveedorId) {
                    console.error('❌ Error: ID de proveedor no encontrado para el item:', item);
                    continue;
                }

                // Validar disponibilidad individual por proveedor
                const disp = await firstValueFrom(this.calService.consultarDisponibilidad(proveedorId, fechaServicioDate));
                if (!disp.disponible) {
                    console.warn(`⚠️ Proveedor ${proveedorId} no disponible: ${disp.error}`);
                    alert(`El proveedor de "${item.nombre}" no está disponible en la fecha seleccionada: ${disp.error}`);
                    continue;
                }

                const solicitud = {
                    cliente_usuario_id: user.id,
                    proveedor_usuario_id: proveedorId,
                    fecha_servicio: this.fechaEvento(),
                    direccion_servicio: this.direccionEvento(),
                    latitud_servicio: this.latitud() || null,
                    longitud_servicio: this.longitud() || null,
                    titulo_evento: `Reservación: ${item.nombre}`,
                    estado: 'pendiente_aprobacion',
                    monto_total: item.precio * item.cantidad,
                    monto_anticipo: 0,
                    monto_liquidacion: 0,
                    horas_respuesta_max: sla.horas_respuesta_max,
                    es_urgente: sla.es_urgente
                };

                console.log('📤 Enviando solicitud:', solicitud);
                await firstValueFrom(this.api.createRequest(solicitud));
            }

            alert('✅ ¡Solicitud enviada!\n\nLos proveedores tienen 24 horas para confirmar tu reservación.');
            this.router.navigate(['/cliente/seguimiento']);

        } catch (error: any) {
            console.error('Error al enviar solicitud:', error);
            alert('Error al enviar la solicitud: ' + (error.message || 'Intenta de nuevo'));
        } finally {
            this.enviandoSolicitud.set(false);
        }
    }
}
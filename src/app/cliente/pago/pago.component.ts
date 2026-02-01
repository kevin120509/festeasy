import { Component, inject, signal, OnInit, AfterViewInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';

declare var paypal: any;

@Component({
    selector: 'app-pago',
    standalone: true,
    imports: [CommonModule, HeaderComponent],
    templateUrl: './pago.component.html'
})
export class PagoComponent implements OnInit, AfterViewInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ApiService);

    solicitud = signal<any>(null);
    loading = signal(true);
    procesando = signal(false);
    showSuccessModal = signal(false);

    // Determinar el tipo de pago basado en el estado de la solicitud
    tipoPago = computed(() => {
        const sol = this.solicitud();
        if (!sol) return 'anticipo';
        // Si el estado es 'entregado_pendiente_liq', es pago de liquidación
        if (sol.estado === 'entregado_pendiente_liq') return 'liquidacion';
        // Si el estado es 'esperando_anticipo', es pago de anticipo
        return 'anticipo';
    });

    // Calcular el monto a pagar
    montoPagar = computed(() => {
        const sol = this.solicitud();
        if (!sol) return 0;

        // Intentar obtener un total base de varias fuentes
        const totalBase = Number(sol.monto_total) || Number(sol.total_calculado) || Number(sol.presupuesto_max) || 0;
        if (totalBase <= 0) return 0;

        let calculado = 0;
        if (this.tipoPago() === 'liquidacion') {
            // El 70% restante (liquidación) o el monto específico si existe
            const liq = Number(sol.monto_liquidacion);
            calculado = liq > 0 ? liq : (totalBase * 0.7);
        } else {
            // El 30% de anticipo o el monto específico si existe
            const ant = Number(sol.monto_anticipo);
            calculado = ant > 0 ? ant : (totalBase * 0.3);
        }

        // Retornar con 2 decimales para evitar problemas de redondeo a cero en montos pequeños
        // y asegurar que si el cálculo es > 0, el resultado sea al menos 0.01
        if (calculado > 0 && calculado < 0.01) calculado = 0.01;
        return parseFloat(calculado.toFixed(2));
    });

    // Título dinámico
    tituloPago = computed(() => {
        return this.tipoPago() === 'liquidacion'
            ? 'Pago de Liquidación'
            : 'Pago de Anticipo';
    });

    // Verificar si el pago ya está completado
    pagoYaCompletado = computed(() => {
        const sol = this.solicitud();
        if (!sol) return false;
        return sol.estado === 'finalizado' || sol.estado === 'reservado';
    });

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarSolicitud(id);
        } else {
            this.router.navigate(['/cliente/dashboard']);
        }
    }

    ngAfterViewInit() {
        // Los botones se renderizarán cuando la solicitud esté cargada
    }

    cargarSolicitud(id: string) {
        this.api.getRequestById(id).subscribe({
            next: (data) => {
                const solicitudConItems = { ...data };

                // Si el monto total es 0, intentamos recuperarlo de los items
                if (!data.monto_total || data.monto_total === 0) {
                    console.log('⚠️ Monto total es 0, recuperando items para calcular...');
                    this.api.getRequestItems(id).subscribe({
                        next: (items) => {
                            const totalCalculado = items.reduce((acc, item) =>
                                acc + ((item.precio_unitario || 0) * (item.cantidad || 0)), 0);

                            console.log('✅ Total calculado desde items:', totalCalculado);
                            solicitudConItems.total_calculado = totalCalculado;

                            this.solicitud.set(solicitudConItems);
                            this.finalizarCarga(solicitudConItems);
                        },
                        error: (err) => {
                            console.error('Error recuperando items para cálculo:', err);
                            this.solicitud.set(data);
                            this.finalizarCarga(data);
                        }
                    });
                } else {
                    this.solicitud.set(data);
                    this.finalizarCarga(data);
                }
            },
            error: (err) => {
                console.error('Error cargando solicitud para pago', err);
                alert('No se pudo cargar la información del pago');
                this.router.navigate(['/cliente/dashboard']);
            }
        });
    }

    private finalizarCarga(data: any) {
        this.loading.set(false);

        // Si el estado es 'finalizado', no hay nada que pagar
        if (data.estado === 'finalizado') {
            return;
        }

        // Si el estado es 'reservado' y el usuario llegó aquí, no permitir otro anticipo
        if (data.estado === 'reservado') {
            return;
        }

        // Solo renderizar si el monto es válido
        const monto = this.montoPagar();
        if (monto > 0) {
            console.log(`✅ Monto a pagar determinado: ${monto} (${this.tipoPago()})`);
            setTimeout(() => this.renderPaypalButtons(), 100);
        } else {
            console.error('❌ No se pudo determinar un monto válido para el pago');
            console.log('Detalles de la solicitud:', {
                id: data.id,
                estado: data.estado,
                monto_total: data.monto_total,
                monto_anticipo: data.monto_anticipo,
                monto_liquidacion: data.monto_liquidacion,
                total_calculado: data.total_calculado,
                tipo_pago: this.tipoPago(),
                monto_pagar_resultado: monto
            });
        }
    }

    renderPaypalButtons() {
        if (!document.getElementById('paypal-button-container')) return;

        paypal.Buttons({
            style: {
                color: 'black',
                shape: 'rect',
                label: 'pay',
                height: 48
            },
            createOrder: (data: any, actions: any) => {
                const descripcion = this.tipoPago() === 'liquidacion'
                    ? `Liquidación - Evento: ${this.solicitud().titulo_evento}`
                    : `Anticipo - Evento: ${this.solicitud().titulo_evento}`;

                return actions.order.create({
                    purchase_units: [{
                        description: descripcion,
                        amount: {
                            currency_code: 'MXN',
                            value: this.montoPagar().toString()
                        }
                    }]
                });
            },
            onApprove: async (data: any, actions: any) => {
                this.procesando.set(true);
                const order = await actions.order.capture();
                console.log('Pago capturado:', order);
                this.finalizarPago('paypal', order.id);
            },
            onError: (err: any) => {
                console.error('Error en PayPal:', err);
                this.procesando.set(false);
            }
        }).render('#paypal-button-container');
    }

    async finalizarPago(metodo: string, referencia: string) {
        try {
            console.log('🔄 Iniciando finalización de pago:', { metodo, referencia });
            const sol = this.solicitud();
            const id = sol.id;
            const esLiquidacion = this.tipoPago() === 'liquidacion';

            // Determinar el nuevo estado
            const nuevoEstado = esLiquidacion ? 'finalizado' : 'reservado';
            console.log(`📝 Actualizando estado de solicitud ${id} a: ${nuevoEstado}`);

            // Intentar actualizar usando ApiService
            try {
                // Usamos firstValueFrom para manejarlo como promesa de forma moderna
                const response = await this.api.updateRequestStatus(id, nuevoEstado).toPromise();
                console.log('✅ Estado actualizado exitosamente:', response);
            } catch (updateError: any) {
                console.error('❌ Error al actualizar estado vía ApiService:', updateError);
                // Si falla, intentamos una descripción más detallada del error
                throw updateError;
            }

            // En lugar de alert, mostrar modal de éxito
            this.showSuccessModal.set(true);

        } catch (error: any) {
            console.error('CRITICAL: Error finalizando pago:', error);
            let errorMsg = 'Hubo un error al confirmar el pago en nuestro sistema.';
            if (error.message) errorMsg += `\nDetalle: ${error.message}`;
            if (error.details) errorMsg += `\nInfo: ${error.details}`;

            alert(errorMsg);
        } finally {
            this.procesando.set(false);
        }
    }

    // Método para pruebas manuales
    async procesarPagoSimulado() {
        if (this.procesando()) return;
        this.procesando.set(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.finalizarPago('demo', 'simulated-ref');
    }

    cerrarModalYSalir() {
        this.showSuccessModal.set(false);
        const id = this.solicitud()?.id;
        if (id) {
            this.router.navigate(['/cliente/solicitudes', id]);
        } else {
            this.router.navigate(['/cliente/dashboard']);
        }
    }

    volverASolicitudes() {
        this.router.navigate(['/cliente/solicitudes']);
    }
}

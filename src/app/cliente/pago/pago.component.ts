import { Component, inject, signal, OnInit, AfterViewInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
        const montoTotal = sol.monto_total || 0;

        if (this.tipoPago() === 'liquidacion') {
            // El 70% restante (liquidación)
            return sol.monto_liquidacion || Math.round(montoTotal * 0.7);
        } else {
            // El 30% de anticipo
            return sol.monto_anticipo || Math.round(montoTotal * 0.3);
        }
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
                this.solicitud.set(data);
                this.loading.set(false);

                // Si el estado es 'finalizado', no hay nada que pagar
                if (data.estado === 'finalizado') {
                    // No renderizar botones, mostrar mensaje de ya pagado
                    return;
                }

                // Si el estado es 'reservado' y el usuario llegó aquí, no permitir otro anticipo
                if (data.estado === 'reservado') {
                    return;
                }

                setTimeout(() => this.renderPaypalButtons(), 100);
            },
            error: (err) => {
                console.error('Error cargando solicitud para pago', err);
                alert('No se pudo cargar la información del pago');
                this.router.navigate(['/cliente/dashboard']);
            }
        });
    }

    renderPaypalButtons() {
        if (!document.getElementById('paypal-button-container')) return;

        paypal.Buttons({
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
                alert('Hubo un error con PayPal. Inténtalo de nuevo.');
            }
        }).render('#paypal-button-container');
    }

    async finalizarPago(metodo: string, referencia: string) {
        try {
            const id = this.solicitud().id;
            const esLiquidacion = this.tipoPago() === 'liquidacion';
            const nuevoEstado = esLiquidacion ? 'finalizado' : 'reservado';

            console.log(`Confirmando pago (${metodo}) para solicitud ${id}...`);
            await firstValueFrom(this.api.updateRequestStatus(id, nuevoEstado));
            
            console.log('✅ Estado actualizado exitosamente');
            
            // Mostrar modal de éxito en lugar de alert
            this.showSuccessModal.set(true);

        } catch (error: any) {
            console.error('Error finalizando pago:', error);
            let errorMsg = 'Hubo un error al confirmar el pago en nuestro sistema.';
            if (error.message) errorMsg += `\nDetalle: ${error.message}`;
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

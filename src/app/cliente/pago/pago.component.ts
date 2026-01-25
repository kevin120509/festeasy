import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
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
                return actions.order.create({
                    purchase_units: [{
                        description: `Evento: ${this.solicitud().titulo_evento}`,
                        amount: {
                            currency_code: 'MXN',
                            value: this.solicitud().monto_total.toString()
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
            await this.api.updateRequestStatus(id, 'reservado').toPromise();

            // Éxito
            alert('¡Pago realizado con éxito! Tu evento ha sido confirmado.');
            this.router.navigate(['/cliente/solicitudes', id]);

        } catch (error) {
            console.error('Error finalizando pago:', error);
            alert('Hubo un error al confirmar el pago en nuestro sistema.');
        } finally {
            this.procesando.set(false);
        }
    }

    // Método anterior para compatibilidad o pruebas manuales (si se desea mantener)
    async procesarPagoSimulado() {
        if (this.procesando()) return;
        this.procesando.set(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.finalizarPago('demo', 'simulated-ref');
    }
}

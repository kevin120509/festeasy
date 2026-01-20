import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-pago',
    standalone: true,
    imports: [CommonModule, HeaderComponent],
    templateUrl: './pago.component.html'
})
export class PagoComponent implements OnInit {
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

    cargarSolicitud(id: string) {
        this.api.getRequestById(id).subscribe({
            next: (data) => {
                this.solicitud.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando solicitud para pago', err);
                alert('No se pudo cargar la información del pago');
                this.router.navigate(['/cliente/dashboard']);
            }
        });
    }

    async procesarPago() {
        if (this.procesando()) return;
        this.procesando.set(true);

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Actualizar estado de la solicitud a 'reservado' (o 'en_progreso')
            // y registrar el pago (aquí simplificado, solo actualizamos estado)
            const id = this.solicitud().id;
            
            await this.api.updateRequestStatus(id, 'reservado').toPromise();
            
            // Éxito
            alert('¡Pago realizado con éxito! Tu evento ha sido confirmado.');
            this.router.navigate(['/cliente/solicitudes', id]);
            
        } catch (error) {
            console.error('Error procesando pago:', error);
            alert('Hubo un error al procesar el pago. Inténtalo de nuevo.');
        } finally {
            this.procesando.set(false);
        }
    }
}

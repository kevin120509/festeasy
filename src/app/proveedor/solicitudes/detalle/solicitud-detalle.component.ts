import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ServiceRequest, RequestItem } from '../../../models';

@Component({
    selector: 'app-solicitud-detalle',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, RouterModule],
    templateUrl: './solicitud-detalle.component.html'
})
export class SolicitudDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ApiService);

    solicitud = signal<ServiceRequest | null>(null);
    items = signal<RequestItem[]>([]);
    isLoading = signal(true);
    mensajeError = signal('');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarDetalle(id);
        } else {
            this.mensajeError.set('No se encontró el ID de la solicitud');
            this.isLoading.set(false);
        }
    }

    cargarDetalle(id: string): void {
        this.isLoading.set(true);
        this.api.getRequestById(id).subscribe({
            next: (data) => {
                this.solicitud.set(data);
                this.cargarItems(id);
            },
            error: (err) => {
                console.error('Error cargando detalle:', err);
                this.mensajeError.set('No se pudo cargar la información del evento');
                this.isLoading.set(false);
            }
        });
    }

    cargarItems(id: string): void {
        this.api.getRequestItems(id).subscribe({
            next: (data) => {
                this.items.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error cargando items:', err);
                this.isLoading.set(false);
            }
        });
    }

    volver(): void {
        this.router.navigate(['/proveedor/solicitudes']);
    }

    formatearFecha(fechaStr: string): string {
        if (!fechaStr) return '';
        return new Date(fechaStr).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    contactarCliente(): void {
        const tel = this.solicitud()?.client?.telefono;
        if (tel) {
            window.open(`https://wa.me/${tel.replace(/\s+/g, '')}`, '_blank');
        }
    }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ServiceRequest, RequestItem } from '../../../models';
import { ValidarPin } from '../../validar-pin/validar-pin';
import { esDiaDelEvento, formatearFechaEvento } from '../../../utils/date.utils';

@Component({
    selector: 'app-solicitud-detalle',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, RouterModule, ValidarPin],
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
    mensajeExito = signal('');

    // Control del modal de validación de PIN
    mostrarModalPin = signal(false);
    solicitudSeleccionadaId = signal<string>('');

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
                console.log('📌 Detalle de solicitud cargado:', data);
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
        // Fix timezone issue by appending time or splitting
        // new Date('2026-01-30') is UTC, so -6h is previous day 18:00
        // new Date('2026-01-30T00:00:00') is Local
        const fecha = new Date(fechaStr + 'T00:00:00');
        return fecha.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getHora(): string {
        const titulo = this.solicitud()?.titulo_evento || '';
        const match = titulo.match(/\(([^)]+)\)/); // Finds text inside ()
        return match ? match[1] : 'Por definir';
    }

    getInvitados(): string {
        const titulo = this.solicitud()?.titulo_evento || '';
        const match = titulo.match(/- (\d+) invitados/); // Finds "- N invitados"
        return match ? match[1] : 'No especificado';
    }

    getTituloReal(): string {
        let titulo = this.solicitud()?.titulo_evento || '';
        // Remove time
        titulo = titulo.replace(/\s*\([^)]+\)/, '');
        // Remove guests
        titulo = titulo.replace(/\s*-\s*\d+\s*invitados/, '');
        return titulo.trim();
    }



    /**
     * 🔒 LÓGICA DE PIN
     */
    abrirModalPin() {
        const id = this.solicitud()?.id;
        if (id) {
            this.solicitudSeleccionadaId.set(id);
            this.mostrarModalPin.set(true);
        }
    }

    cerrarModalPin() {
        this.mostrarModalPin.set(false);
    }

    onPinValidado(solicitudActualizada: ServiceRequest) {
        console.log('✅ PIN validado en detalle:', solicitudActualizada);
        this.solicitud.set(solicitudActualizada);
        this.mensajeExito.set('¡PIN validado! Servicio finalizado exitosamente.');
        setTimeout(() => this.mensajeExito.set(''), 4000);
        this.cerrarModalPin();
    }

    esDiaDelEvento(fecha: string | undefined): boolean {
        if (!fecha) return false;
        return esDiaDelEvento(fecha);
    }

    formatearFechaCompleta(fecha: string | undefined): string {
        if (!fecha) return '';
        return formatearFechaEvento(fecha);
    }
}

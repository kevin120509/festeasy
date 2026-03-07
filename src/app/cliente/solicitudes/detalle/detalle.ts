import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { FormsModule } from '@angular/forms';
import { ChatNegociacionComponent } from '../../../shared/chat-negociacion/chat-negociacion.component';
import { PanelCotizacionComponent } from '../../../proveedor/solicitudes/panel-cotizacion/panel-cotizacion.component';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDialogModule, DialogModule, ButtonModule, RippleModule, FormsModule, ChatNegociacionComponent, PanelCotizacionComponent],
  providers: [ConfirmationService],
  templateUrl: './detalle.html'
})
export class DetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ApiService);
    private confirmationService = inject(ConfirmationService);
    public auth = inject(AuthService);

    solicitud = signal<any>(null);
    items = signal<any[]>([]);
    isLoading = signal(true);
    mensajeError = signal('');
    mensajeExito = signal('');
    procesando = signal(false);

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
            next: (data: any) => {
                this.solicitud.set(data);

                // Check if there is a custom package JSON saved
                if (data.cotizacion_borrador && data.cotizacion_borrador.items) {
                    this.items.set(data.cotizacion_borrador.items);
                    this.isLoading.set(false);
                } else {
                    this.cargarItems(id);
                }
            },
            error: (err: any) => {
                console.error('Error cargando detalle:', err);
                this.mensajeError.set('No se pudo cargar la información del evento');
                this.isLoading.set(false);
            }
        });
    }

    cargarItems(id: string): void {
        this.api.getRequestItems(id).subscribe({
            next: (data: any) => {
                this.items.set(data);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                console.error('Error cargando items:', err);
                this.isLoading.set(false);
            }
        });
    }

    volver(): void {
        this.router.navigate(['/cliente/solicitudes']);
    }

    getTituloReal(): string {
        let titulo = this.solicitud()?.titulo_evento || '';
        titulo = titulo.replace(/\s*\([^)]+\)/, '');
        titulo = titulo.replace(/\s*-\s*\d+\s*invitados/, '');
        return titulo.trim();
    }

    /**
     * ✅ Aceptar Propuesta Oficial
     */
    aceptarPropuesta(): void {
        const id = this.solicitud()?.id;
        if (!id || this.procesando()) return;

        this.procesando.set(true);
        this.api.updateSolicitudEstado(id, 'esperando_anticipo').subscribe({
            next: () => {
                this.mensajeExito.set('¡Propuesta aceptada! Redirigiendo a pago...');
                setTimeout(() => {
                    this.procesando.set(false);
                    // Redirigir a checkout o pasarela de pago real. Por ahora, a mis solicitudes.
                    this.router.navigate(['/cliente/solicitudes']);
                }, 1500);
            },
            error: (err) => {
                console.error('Error aceptando propuesta:', err);
                this.mensajeError.set('No se pudo aceptar la propuesta');
                setTimeout(() => this.mensajeError.set(''), 3000);
                this.procesando.set(false);
            }
        });
    }
}

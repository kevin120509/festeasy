import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ServiceRequest, Quote } from '../../models';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [HeaderComponent, CommonModule],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    private auth = inject(AuthService);
    private supabaseData = inject(SupabaseDataService);
    private api = inject(ApiService);

    // Usamos la interfaz ServiceRequest para mayor seguridad
    solicitudes = signal<ServiceRequest[]>([]);
    isLoading = signal<boolean>(false);

    // Control de modal de cotización
    mostrarModalCotizacion = signal<boolean>(false);
    solicitudSeleccionada = signal<string | null>(null);
    precioPropuesto = signal<number>(0);

    // Mensajes
    mensajeExito = signal<string>('');
    mensajeError = signal<string>('');

    ngOnInit(): void {
        this.cargarSolicitudes();
    }

    cargarSolicitudes() {
        const user = this.auth.currentUser();
        if (!user || !user.id) return;

        this.isLoading.set(true);
        // Usamos el método específico del servicio
        this.supabaseData.getRequestsByProvider(user.id).subscribe({
            next: (requests) => {
                this.solicitudes.set(requests);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                console.error('Error al cargar solicitudes:', err);
                this.isLoading.set(false);
            }
        });
    }

    aceptar(id: string) {
        // Solicitar precio al proveedor usando prompt nativo
        const precioInput = window.prompt('Ingresa el precio total propuesto para este servicio:', '');

        if (precioInput === null) {
            // Usuario canceló
            return;
        }

        const precio = parseFloat(precioInput);

        if (isNaN(precio) || precio <= 0) {
            this.mensajeError.set('Por favor ingresa un precio válido');
            setTimeout(() => this.mensajeError.set(''), 3000);
            return;
        }

        // Obtener el usuario actual (proveedor)
        const currentUser = this.auth.currentUser();
        if (!currentUser || !currentUser.id) {
            this.mensajeError.set('Error: No se pudo identificar el usuario');
            setTimeout(() => this.mensajeError.set(''), 3000);
            return;
        }

        // Crear la cotización
        const quoteData: Partial<Quote> = {
            solicitud_id: id,
            proveedor_usuario_id: currentUser.id,
            precio_total_propuesto: precio,
            estado: 'pendiente'
        };

        this.api.createQuote(quoteData).subscribe({
            next: (quote: any) => {
                // Actualizar el estado de la solicitud a 'reservado' (estado válido)
                this.api.updateRequestStatus(id, 'reservado').subscribe({
                    next: () => {
                        this.solicitudes.update(items =>
                            items.map(s => s.id === id ? { ...s, estado: 'reservado' as const } : s)
                        );
                        this.mensajeExito.set('Cotización enviada exitosamente');
                        setTimeout(() => this.mensajeExito.set(''), 3000);
                    },
                    error: (err: any) => {
                        console.error('Error al actualizar estado:', err);
                        this.mensajeError.set('Error al actualizar el estado de la solicitud');
                        setTimeout(() => this.mensajeError.set(''), 3000);
                    }
                });
            },
            error: (err: any) => {
                console.error('Error al crear cotización:', err);
                this.mensajeError.set('Error al crear la cotización');
                setTimeout(() => this.mensajeError.set(''), 3000);
            }
        });
    }

    rechazar(id: string) {
        this.supabaseData.updateRequestStatus(id, 'rechazada').then(
            () => {
                this.solicitudes.update(items => items.filter(s => s.id !== id));
            },
            (err) => {
                console.error('Error al rechazar solicitud:', err);
            }
        );
    }
}

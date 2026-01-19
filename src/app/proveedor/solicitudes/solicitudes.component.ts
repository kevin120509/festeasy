import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { ServiceRequest } from '../../models'; //

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [HeaderComponent, CommonModule],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    private api = inject(ApiService);

    // Usamos la interfaz ServiceRequest para mayor seguridad
    solicitudes = signal<ServiceRequest[]>([]);
    isLoading = signal<boolean>(false);

    ngOnInit(): void {
        this.cargarSolicitudes();
    }

    cargarSolicitudes() {
        this.isLoading.set(true);
        // Usamos el método específico del servicio
        this.api.getProviderRequests().subscribe({
            next: (requests) => {
                this.solicitudes.set(requests);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar solicitudes:', err);
                this.isLoading.set(false);
            }
        });
    }

    aceptar(id: string) {
        // Actualizamos al estado definido en el modelo
        this.api.updateRequestStatus(id, 'reservado').subscribe({
            next: () => {
                this.solicitudes.update(items =>
                    items.map(s => s.id === id ? { ...s, estado: 'reservado' as const } : s)
                );
            },
            error: (err) => {
                console.error('Error al aceptar solicitud:', err);
            }
        });
    }

    rechazar(id: string) {
        this.api.updateRequestStatus(id, 'rechazada').subscribe({
            next: () => {
                this.solicitudes.update(items => items.filter(s => s.id !== id));
            },
            error: (err) => {
                console.error('Error al rechazar solicitud:', err);
            }
        });
    }
}
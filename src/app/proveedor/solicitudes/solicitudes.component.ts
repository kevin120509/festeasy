import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ServiceRequest } from '../../models'; //

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [HeaderComponent, CommonModule],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    private auth = inject(AuthService);
    private supabaseData = inject(SupabaseDataService);

    // Usamos la interfaz ServiceRequest para mayor seguridad
    solicitudes = signal<ServiceRequest[]>([]);
    isLoading = signal<boolean>(false);

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
            error: (err) => {
                console.error('Error al cargar solicitudes:', err);
                this.isLoading.set(false);
            }
        });
    }

    aceptar(id: string) {
        // Actualizamos al estado definido en el modelo
        this.supabaseData.updateRequestStatus(id, 'reservado').then(
            () => {
                this.solicitudes.update(items =>
                    items.map(s => s.id === id ? { ...s, estado: 'reservado' as const } : s)
                );
            },
            (err) => {
                console.error('Error al aceptar solicitud:', err);
            }
        );
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
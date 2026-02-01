import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResenasService } from '../../../services/resenas.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-resenas-summary',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './resenas-summary.component.html',
    styleUrls: ['./resenas-summary.component.css']
})
export class ResenasSummaryComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private resenasService = inject(ResenasService);
    private authService = inject(AuthService);

    eventoId = signal<string | null>(null);
    solicitudes = signal<any[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.eventoId.set(this.route.snapshot.paramMap.get('eventoId'));
        this.cargarSolicitudes();
    }

    async cargarSolicitudes() {
        // Asegurarse de que el usuario esté autenticado
        const ok = await this.authService.waitForAuth();
        const user = this.authService.currentUser();

        if (!ok || !user?.id) {
            this.router.navigate(['/login']);
            return;
        }

        // Si tenemos un eventoId en la URL, podríamos filtrar por él en el futuro.
        // Por ahora, traemos todos los pendientes del cliente actual para no fallar.
        this.resenasService.getSolicitudesPendientesDeCalificacion(user.id).subscribe({
            next: (data) => {
                // Si el eventoId existe, opcionalmente filtramos localmente (si quisiéramos)
                // Pero por ahora mostramos todos para asegurar visibilidad
                this.solicitudes.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando solicitudes para reseña', err);
                this.loading.set(false);
            }
        });
    }

    calificarTodos() {
        if (this.solicitudes().length > 0) {
            // Redirigir al primero que falte
            const primera = this.solicitudes()[0];
            this.router.navigate(['/cliente/resenas/crear', primera.id]);
        }
    }

    saltarPorAhora() {
        this.router.navigate(['/cliente/dashboard']);
    }

    getUserName(): string {
        const user = this.authService.currentUser();
        return user?.nombre_completo || user?.nombre || 'Usuario';
    }
}

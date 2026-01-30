import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResenasService } from '../../../services/resenas.service';

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

    eventoId = signal<string | null>(null);
    solicitudes = signal<any[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.eventoId.set(this.route.snapshot.paramMap.get('eventoId'));
        if (this.eventoId()) {
            this.cargarSolicitudes();
        } else {
            // Si no hay ID, redirigir al dashboard
            this.router.navigate(['/cliente/dashboard']);
        }
    }

    cargarSolicitudes() {
        this.resenasService.getSolicitudesAFinalizar(this.eventoId()!).subscribe({
            next: (data) => {
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
}

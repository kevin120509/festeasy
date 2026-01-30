import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResenasService } from '../../services/resenas.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-resenas-recibidas',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './resenas-recibidas.component.html',
    styles: [`
        .star-rating {
            color: #fbbf24;
        }
        .empty-star {
            color: #d1d5db;
        }
    `]
})
export class ResenasRecibidasComponent implements OnInit {
    private resenasService = inject(ResenasService);
    private auth = inject(AuthService);

    resenas = signal<any[]>([]);
    stats = signal({ promedio: 0, total: 0 });
    loading = signal(true);

    async ngOnInit() {
        const user = this.auth.currentUser();
        if (user?.id) {
            this.cargarDatos(user.id);
        }
    }

    cargarDatos(providerId: string) {
        this.loading.set(true);

        // Cargar estadísticas
        this.resenasService.getStatsProveedor(providerId).subscribe(s => this.stats.set(s));

        // Cargar lista de reseñas
        this.resenasService.getResenasPorProveedor(providerId).subscribe({
            next: (data) => {
                this.resenas.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando reseñas:', err);
                this.loading.set(false);
            }
        });
    }

    getStars(rating: number): number[] {
        return Array(5).fill(0).map((_, i) => i + 1);
    }
}

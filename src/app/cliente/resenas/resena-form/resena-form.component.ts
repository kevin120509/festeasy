import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResenasService } from '../../../services/resenas.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-resena-form',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './resena-form.component.html',
    styleUrls: ['./resena-form.component.css']
})
export class ResenaFormComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private resenasService = inject(ResenasService);
    private auth = inject(AuthService);

    solicitudId = signal<string | null>(null);
    solicitud = signal<any>(null);
    puntuacionActual = signal(0);
    puntuacionHover = signal(0);
    comentario = signal('');
    isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);

    ngOnInit() {
        this.solicitudId.set(this.route.snapshot.paramMap.get('solicitudId'));
        if (this.solicitudId()) {
            this.cargarDetalleSolicitud();
        } else {
            this.router.navigate(['/cliente/dashboard']);
        }
    }

    cargarDetalleSolicitud() {
        this.resenasService.getSolicitudParaReview(this.solicitudId()!).subscribe({
            next: (data) => {
                this.solicitud.set(data);
            },
            error: (err) => {
                console.error('Error cargando detalle de solicitud', err);
                this.errorMessage.set('No se pudo cargar la información del servicio.');
            }
        });
    }

    setPuntuacion(val: number) {
        this.puntuacionActual.set(val);
    }

    setHover(val: number) {
        this.puntuacionHover.set(val);
    }

    clearHover() {
        this.puntuacionHover.set(0);
    }

    isEstrellaIluminada(i: number): boolean {
        const hover = this.puntuacionHover();
        const current = this.puntuacionActual();
        return hover >= i || (hover === 0 && current >= i);
    }

    async enviarResena() {
        if (this.puntuacionActual() === 0) {
            this.errorMessage.set('Por favor, selecciona una puntuación.');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        const user = this.auth.currentUser();
        if (!user) {
            this.errorMessage.set('Debes estar autenticado para enviar una reseña.');
            this.isSubmitting.set(false);
            return;
        }

        try {
            await this.resenasService.enviarResena({
                usuario_cliente_id: user.id,
                usuario_proveedor_id: this.solicitud().proveedor.usuario_id,
                solicitud_id: this.solicitudId()!,
                puntuacion: this.puntuacionActual(),
                comentario: this.comentario()
            });

            this.router.navigate(['/cliente/resenas/exito']);
        } catch (err: any) {
            console.error('Error enviando reseña', err);
            this.errorMessage.set('Error al enviar la reseña. Inténtalo de nuevo.');
            this.isSubmitting.set(false);
        }
    }

    omitirResena() {
        // Volver al resumen del evento o al dashboard
        this.router.navigate(['/cliente/dashboard']);
    }
}

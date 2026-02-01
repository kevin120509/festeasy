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
        const id = this.solicitudId();
        if (!id) return;

        // 1. Verificar si ya existe una reseña
        this.resenasService.getReviewBySolicitud(id).subscribe(review => {
            if (review) {
                console.log('📝 Esta solicitud ya tiene una reseña:', review);
                this.router.navigate(['/cliente/resenas/exito'], {
                    queryParams: { msg: 'ya_calificado' }
                });
            }
        });

        // 2. Cargar detalle
        this.resenasService.getSolicitudParaReview(id).subscribe({
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

        if (!this.solicitud() || !this.solicitud().proveedor) {
            this.errorMessage.set('La información del proveedor no se ha cargado correctamente.');
            this.isSubmitting.set(false);
            return;
        }

        console.log('📝 ResenaForm: Preparando envío de reseña...');
        try {
            const payload = {
                cliente_id: user.id,
                destinatario_id: this.solicitud().proveedor.usuario_id,
                solicitud_id: this.solicitudId()!,
                calificacion: this.puntuacionActual(),
                comentario: this.comentario()
            };

            console.log('📝 ResenaForm: Payload final:', payload);

            await this.resenasService.enviarResena(payload);

            console.log('📝 ResenaForm: Envío exitoso, navegando...');
            this.router.navigate(['/cliente/resenas/exito']);
        } catch (err: any) {
            console.error('❌ ResenaForm: Error en el envío:', err);

            if (err.code === '23505') {
                this.errorMessage.set('Ya has calificado este servicio anteriormente.');
                setTimeout(() => {
                    this.router.navigate(['/cliente/resenas/exito'], {
                        queryParams: { msg: 'ya_calificado' }
                    });
                }, 2000);
            } else {
                this.errorMessage.set('Error al enviar la reseña. Inténtalo de nuevo.');
            }

            this.isSubmitting.set(false);
        }
    }

    omitirResena() {
        // Volver al resumen del evento o al dashboard
        this.router.navigate(['/cliente/dashboard']);
    }
}

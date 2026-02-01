import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

/**
 * RatingModalComponent
 * 
 * Modal para calificar un servicio finalizado.
 * Permite al cliente dejar una reseña con calificación de 1-5 estrellas y comentario.
 */
@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-white text-4xl">star</span>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">¿Cómo fue tu experiencia?</h2>
        <p class="text-gray-600 text-sm">Tu opinión ayuda a otros clientes</p>
      </div>

      <!-- Rating Stars -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-3 text-center">
          Calificación
        </label>
        <div class="flex justify-center gap-2">
          @for (star of [1, 2, 3, 4, 5]; track star) {
            <button
              type="button"
              (click)="setRating(star)"
              (mouseenter)="hoverRating.set(star)"
              (mouseleave)="hoverRating.set(0)"
              class="transition-all duration-200 transform hover:scale-110 focus:outline-none">
              @if (star <= (hoverRating() || rating())) {
                <span class="material-symbols-outlined text-5xl text-yellow-400 transition-colors duration-200" style="font-variation-settings: 'FILL' 1">star</span>
              } @else {
                <span class="material-symbols-outlined text-5xl text-gray-300 transition-colors duration-200" style="font-variation-settings: 'FILL' 0">star</span>
              }
            </button>
          }
        </div>
        @if (rating() > 0) {
          <p class="text-center mt-2 text-sm font-medium text-gray-700">
            {{ getRatingText() }}
          </p>
        }
        @if (showRatingError()) {
          <p class="text-center mt-2 text-sm text-red-600">
            Por favor selecciona una calificación
          </p>
        }
      </div>

      <!-- Comment Textarea -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          [(ngModel)]="comentario"
          rows="4"
          maxlength="500"
          placeholder="Cuéntanos sobre tu experiencia con este proveedor..."
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none transition-all"
        ></textarea>
        <div class="flex justify-between items-center mt-1">
          <p class="text-xs text-gray-500">Máximo 500 caracteres</p>
          <p class="text-xs text-gray-500">{{ comentario.length }}/500</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          type="button"
          (click)="onCancel()"
          [disabled]="enviando()"
          class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Cancelar
        </button>
        <button
          type="button"
          (click)="onSubmit()"
          [disabled]="enviando()"
          class="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          @if (enviando()) {
            <span class="animate-spin material-symbols-outlined text-xl">progress_activity</span>
            <span>Enviando...</span>
          } @else {
            <span>Enviar Reseña</span>
          }
        </button>
      </div>

      <!-- Success Message -->
      @if (mostrarExito()) {
        <div class="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <span class="material-symbols-outlined text-green-600 text-3xl mb-2">check_circle</span>
          <p class="text-green-800 font-semibold">¡Reseña enviada con éxito!</p>
          <p class="text-green-600 text-sm mt-1">Gracias por tu opinión</p>
        </div>
      }

      <!-- Error Message -->
      @if (errorMensaje()) {
        <div class="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p class="text-red-800 text-sm">{{ errorMensaje() }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class RatingModalComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<RatingModalComponent>);

  // State
  rating = signal(0);
  hoverRating = signal(0);
  comentario = '';
  enviando = signal(false);
  mostrarExito = signal(false);
  showRatingError = signal(false);
  errorMensaje = signal('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: { solicitud_id: string; destinatario_id: string }) { }

  ngOnInit(): void {
    console.log('🎯 RatingModal inicializado con:', this.data);
  }

  /**
   * Establece la calificación seleccionada
   */
  setRating(stars: number): void {
    this.rating.set(stars);
    this.showRatingError.set(false);
    console.log('⭐ Calificación seleccionada:', stars);
  }

  /**
   * Retorna el texto descriptivo de la calificación
   */
  getRatingText(): string {
    const texts: Record<number, string> = {
      1: '😞 Muy malo',
      2: '😕 Malo',
      3: '😐 Regular',
      4: '😊 Bueno',
      5: '🌟 Excelente'
    };
    return texts[this.rating()] || '';
  }

  /**
   * Cancela y cierra el modal
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Envía la reseña
   */
  async onSubmit(): Promise<void> {
    // Validar calificación
    if (this.rating() === 0) {
      this.showRatingError.set(true);
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set('');

    try {
      // Obtener el ID del usuario actual
      const { data: { user } } = await this.apiService.getCurrentUser();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Preparar datos de la reseña
      const reviewData = {
        solicitud_id: this.data.solicitud_id,
        cliente_id: user.id,
        destinatario_id: this.data.destinatario_id,
        calificacion: this.rating(),
        comentario: this.comentario.trim() || undefined
      };

      console.log('📤 Enviando reseña:', reviewData);

      // Enviar reseña
      this.apiService.createReview(reviewData).subscribe({
        next: (response) => {
          console.log('✅ Reseña creada exitosamente:', response);
          this.mostrarExito.set(true);

          // Cerrar modal después de 2 segundos
          setTimeout(() => {
            this.dialogRef.close(response);
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Error al crear reseña:', error);
          this.errorMensaje.set(
            error.message || 'Error al enviar la reseña. Por favor intenta de nuevo.'
          );
          this.enviando.set(false);
        }
      });
    } catch (error: any) {
      console.error('❌ Error en onSubmit:', error);
      this.errorMensaje.set(error.message || 'Error inesperado');
      this.enviando.set(false);
    }
  }
}

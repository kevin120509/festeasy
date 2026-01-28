import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingModalService } from '../services/rating-modal.service';

/**
 * Componente de ejemplo para demostrar el uso del RatingModalComponent
 */
@Component({
    selector: 'app-rating-modal-example',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div class="max-w-2xl mx-auto">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Rating Modal Demo</h1>
          <p class="text-gray-600">Ejemplo de uso del componente de calificación</p>
        </div>

        <!-- Demo Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Simular Servicio Finalizado</h2>
          
          <!-- Form -->
          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Solicitud ID
              </label>
              <input
                type="text"
                [(ngModel)]="solicitudId"
                placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Proveedor ID (Destinatario)
              </label>
              <input
                type="text"
                [(ngModel)]="proveedorId"
                placeholder="Ej: 987e6543-e21b-98d7-a654-123456789000"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>
          </div>

          <!-- Action Button -->
          <button
            (click)="abrirModalCalificacion()"
            [disabled]="!solicitudId || !proveedorId"
            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">star</span>
            <span>Abrir Modal de Calificación</span>
          </button>
        </div>

        <!-- Instructions -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
          <h3 class="font-bold text-yellow-900 mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined">info</span>
            Instrucciones de Uso
          </h3>
          <ol class="space-y-2 text-sm text-yellow-800 list-decimal list-inside">
            <li>Ingresa un ID de solicitud válido (UUID)</li>
            <li>Ingresa el ID del proveedor que recibirá la reseña</li>
            <li>Haz clic en "Abrir Modal de Calificación"</li>
            <li>Selecciona una calificación de 1-5 estrellas</li>
            <li>Opcionalmente, escribe un comentario</li>
            <li>Haz clic en "Enviar Reseña"</li>
          </ol>
        </div>

        <!-- Integration Example -->
        <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 class="font-bold text-gray-900 mb-3">💡 Ejemplo de Integración</h3>
          <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre class="text-xs"><code>{{ codeExample }}</code></pre>
          </div>
        </div>

        <!-- Real-World Usage -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 class="font-bold text-blue-900 mb-3">🚀 Uso en Producción</h3>
          <p class="text-sm text-blue-800 mb-3">
            En tu aplicación real, deberías abrir este modal cuando:
          </p>
          <ul class="space-y-2 text-sm text-blue-800 list-disc list-inside">
            <li>El listener en tiempo real detecte que una solicitud cambió a estado "finalizado"</li>
            <li>El usuario haga clic en un botón "Dejar Reseña" en el historial de servicios</li>
            <li>Después de que el proveedor marque el servicio como completado</li>
          </ul>
        </div>

        <!-- Status Messages -->
        @if (ultimaAccion()) {
          <div class="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p class="text-green-800 font-semibold">{{ ultimaAccion() }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class RatingModalExampleComponent {
    private ratingModalService = inject(RatingModalService);

    // Form data
    solicitudId = '';
    proveedorId = '';
    ultimaAccion = signal('');

    // Code example for display
    codeExample = `// En tu componente
import { RatingModalService } from './services/rating-modal.service';

export class MiComponente {
  private ratingModal = inject(RatingModalService);

  async abrirCalificacion(solicitudId: string, proveedorId: string) {
    await this.ratingModal.open(solicitudId, proveedorId);
    console.log('Modal cerrado');
  }
}

// O usando el listener en tiempo real:
this.apiService.listenToSolicitudFinalizada().subscribe({
  next: ({ solicitud_id, destinatario_id }) => {
    // Abrir modal automáticamente cuando se finalice
    this.ratingModal.open(solicitud_id, destinatario_id);
  }
});`;

    /**
     * Abre el modal de calificación
     */
    async abrirModalCalificacion(): Promise<void> {
        if (!this.solicitudId || !this.proveedorId) {
            alert('Por favor completa ambos campos');
            return;
        }

        console.log('🎯 Abriendo modal con:', {
            solicitudId: this.solicitudId,
            proveedorId: this.proveedorId
        });

        try {
            await this.ratingModalService.open(this.solicitudId, this.proveedorId);
            this.ultimaAccion.set(`✅ Modal cerrado - Solicitud: ${this.solicitudId.substring(0, 8)}...`);

            // Limpiar mensaje después de 5 segundos
            setTimeout(() => {
                this.ultimaAccion.set('');
            }, 5000);
        } catch (error) {
            console.error('Error abriendo modal:', error);
            this.ultimaAccion.set('❌ Error al abrir el modal');
        }
    }
}

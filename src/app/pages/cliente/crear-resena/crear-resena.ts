import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-crear-resena',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './crear-resena.html'
})
export class CrearResenaComponent {
    @Input() solicitudId: string = '';
    @Input() proveedorId: string = '';
    @Input() clienteId: string = '';
    @Input() isOpen: boolean = false;

    @Output() closeModal = new EventEmitter<void>();
    @Output() resenaEnviada = new EventEmitter<void>();

    private supabase = inject(SupabaseService);

    // Estado de la calificación (DB: calificacion)
    puntuacionActual = signal<number>(0);
    puntuacionHover = signal<number>(0);
    comentario = signal<string>('');

    // Estado del formulario
    isSubmitting = signal<boolean>(false);
    errorMessage = signal<string>('');
    successMessage = signal<string>('');

    /**
     * Establece la puntuación al hacer clic en una estrella
     */
    setPuntuacion(valor: number): void {
        this.puntuacionActual.set(valor);
        this.errorMessage.set(''); // Limpiar error al seleccionar
    }

    /**
     * Establece el hover temporal al pasar el mouse
     */
    setHover(valor: number): void {
        this.puntuacionHover.set(valor);
    }

    /**
     * Limpia el hover al salir del área de estrellas
     */
    clearHover(): void {
        this.puntuacionHover.set(0);
    }

    /**
     * Determina si una estrella debe estar iluminada
     */
    isEstrellaIluminada(index: number): boolean {
        const hover = this.puntuacionHover();
        const actual = this.puntuacionActual();

        // Si hay hover, usarlo; si no, usar la puntuación actual
        const valorVisible = hover > 0 ? hover : actual;
        return index <= valorVisible;
    }

    /**
     * Envía la reseña a Supabase
     */
    async enviarResena(): Promise<void> {
        // Validación
        if (this.puntuacionActual() === 0) {
            this.errorMessage.set('Por favor, selecciona una calificación');
            return;
        }

        if (!this.solicitudId || !this.proveedorId || !this.clienteId) {
            this.errorMessage.set('Información de la solicitud incompleta');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            const client = this.supabase.getClient();

            console.log('📝 Enviando reseña con datos:', {
                solicitud_id: this.solicitudId,
                cliente_id: this.clienteId,
                destinatario_id: this.proveedorId,
                calificacion: this.puntuacionActual()
            });

            // Insertar reseña en la tabla 'resenas' con nombres correctos de columnas
            const { data, error } = await client
                .from('resenas')
                .insert({
                    solicitud_id: this.solicitudId,
                    cliente_id: this.clienteId,           // ✅ Nombre correcto según schema
                    destinatario_id: this.proveedorId,  // ✅ Nombre correcto según schema
                    calificacion: this.puntuacionActual(), // ✅ Nombre correcto según schema
                    comentario: this.comentario() || null
                    // creado_en se genera automáticamente en la BD
                })
                .select()
                .single();

            if (error) {
                console.error('Database Error:', error); // Debug log
                throw error;
            }

            // Éxito
            console.log('✅ Reseña creada exitosamente:', data);
            this.successMessage.set('¡Gracias por tu calificación!');

            // Esperar un momento (UX) antes de cerrar
            setTimeout(() => {
                this.resenaEnviada.emit(); // Notificar al padre
                this.closeModal.emit();     // Cerrar modal
                this.resetForm();           // Limpiar estado
            }, 1500);

        } catch (error: any) {
            console.error('❌ Error al enviar reseña:', error);
            this.errorMessage.set('No se pudo enviar la calificación. Intenta nuevamente.');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    /**
     * Omite la reseña y cierra el modal
     */
    omitirResena(): void {
        this.closeModal.emit();
        this.resetForm();
    }

    /**
     * Resetea el formulario
     */
    private resetForm(): void {
        this.puntuacionActual.set(0);
        this.puntuacionHover.set(0);
        this.comentario.set('');
        this.errorMessage.set('');
        this.successMessage.set('');
    }
}

import { Component, EventEmitter, Input, Output, inject, ViewChildren, QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ServiceRequest } from '../../models';


@Component({
  selector: 'app-validar-pin',
  imports: [CommonModule, FormsModule],
  templateUrl: './validar-pin.html',
  styleUrl: './validar-pin.css',
  standalone: true
})
export class ValidarPin {
  @Input() solicitudId: string = '';
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() pinValidado = new EventEmitter<ServiceRequest>();

  public supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  // Arreglo para almacenar los 4 dígitos del PIN
  pinDigits: string[] = ['', '', '', ''];

  // Referencias a los inputs
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  isValidating = false;
  errorMessage = '';
  successMessage = '';
  showShakeAnimation = false; // Para la animación de error


  /**
   * Maneja el input de cada dígito y mueve el foco automáticamente
   */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Solo permitir números
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      this.pinDigits[index] = '';
      return;
    }

    // Guardar el dígito
    this.pinDigits[index] = value;

    // Limpiar mensajes de error al escribir
    this.errorMessage = '';

    // Mover el foco al siguiente input si existe
    if (value && index < 3) {
      const nextInput = this.pinInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }
  }

  /**
   * Maneja el evento de tecla presionada para el backspace
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Si se presiona backspace y el input está vacío, ir al anterior
    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      const prevInput = this.pinInputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
        prevInput.nativeElement.select();
      }
    }
  }

  /**
   * Pega el PIN completo si el usuario hace paste
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';

    // Solo tomar los primeros 4 dígitos numéricos
    const digits = pastedData.replace(/\D/g, '').slice(0, 4);

    for (let i = 0; i < digits.length && i < 4; i++) {
      this.pinDigits[i] = digits[i];
      const input = this.pinInputs.toArray()[i];
      if (input) {
        input.nativeElement.value = digits[i];
      }
    }

    // Mover el foco al último input rellenado o al siguiente vacío
    const nextEmptyIndex = this.pinDigits.findIndex(d => !d);
    const focusIndex = nextEmptyIndex === -1 ? 3 : nextEmptyIndex;
    const input = this.pinInputs.toArray()[focusIndex];
    if (input) {
      input.nativeElement.focus();
    }
  }

  /**
   * Verifica si el PIN está completo (4 dígitos)
   */
  get isPinComplete(): boolean {
    return this.pinDigits.every(digit => digit !== '');
  }

  /**
   * Obtiene el PIN completo como string
   */
  get fullPin(): string {
    return this.pinDigits.join('');
  }

  /**
   * Valida el PIN y actualiza el estado de la solicitud
   */
  async confirmarPin(): Promise<void> {
    if (!this.isPinComplete) {
      this.errorMessage = 'Por favor, complete el PIN de 4 dígitos';
      return;
    }

    if (!this.solicitudId) {
      this.errorMessage = 'No se ha especificado una solicitud';
      return;
    }

    this.isValidating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.showShakeAnimation = false;

    try {
      const client = this.supabase.getClient();

      // 1. Obtener la solicitud actual
      const { data: solicitud, error: fetchError } = await client
        .from('solicitudes')
        .select('*')
        .eq('id', this.solicitudId)
        .single();

      if (fetchError || !solicitud) {
        throw new Error('No se pudo encontrar la solicitud');
      }

      // 2. Verificar el PIN
      if (solicitud.pin_validacion !== this.fullPin) {
        // 🔴 PIN INCORRECTO
        this.errorMessage = 'PIN incorrecto. Inténtalo de nuevo';
        this.showShakeAnimation = true;
        this.cdr.detectChanges(); // ✅ Actualizar interfaz

        // Esperar un momento antes de limpiar los inputs
        setTimeout(() => {
          this.pinDigits = ['', '', '', ''];
          this.resetPin();
          this.showShakeAnimation = false;
          this.cdr.detectChanges(); // ✅ Actualizar interfaz
        }, 500);

        return; // Salir del método
      }

      // 3. Actualizar la solicitud con la fecha de validación
      // El estado pasa a 'entregado_pendiente_liq' para esperar el pago de liquidación
      const { data: updatedSolicitud, error: updateError } = await client
        .from('solicitudes')
        .update({
          fecha_validacion_pin: new Date().toISOString(),
          estado: 'entregado_pendiente_liq',
          actualizado_en: new Date().toISOString()
        })
        .eq('id', this.solicitudId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Error al actualizar la solicitud');
      }

      // 4. Éxito ✅
      this.successMessage = '¡PIN validado! El cliente puede proceder con el pago de liquidación.';
      this.cdr.detectChanges(); // ✅ Actualizar interfaz

      // Cerrar modal y emitir evento después de mostrar el mensaje
      setTimeout(() => {
        this.pinValidado.emit(updatedSolicitud);
        this.close();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error validando PIN:', error);
      this.errorMessage = error.message || 'Ocurrió un error al validar el PIN. Por favor, intenta nuevamente.';
      this.showShakeAnimation = true;

      // Limpiar mensaje de error después de 4 segundos
      setTimeout(() => {
        this.errorMessage = '';
        this.showShakeAnimation = false;
      }, 4000);

    } finally {
      // ✅ SIEMPRE resetear el estado de validación
      this.isValidating = false;

      // 🔥 CRÍTICO: Forzar detección de cambios para sincronizar interfaz
      this.cdr.detectChanges();

      console.log('🔄 Estado reseteado. isValidating:', this.isValidating);
    }
  }

  /**
   * Resetea el PIN y enfoca el primer input
   */
  resetPin(): void {
    this.pinDigits = ['', '', '', ''];
    const firstInput = this.pinInputs.toArray()[0];
    if (firstInput) {
      firstInput.nativeElement.focus();
    }
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.resetPin();
    this.errorMessage = '';
    this.successMessage = '';
    this.closeModal.emit();
  }
}

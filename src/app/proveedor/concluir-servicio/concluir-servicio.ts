import { Component, EventEmitter, Input, Output, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ServiceRequest } from '../../models';

@Component({
    selector: 'app-concluir-servicio',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './concluir-servicio.html',
    styleUrl: './concluir-servicio.css'
})
export class ConcluirServicioComponent implements AfterViewInit {
    @Input() solicitud: ServiceRequest | null = null;
    @Input() isOpen: boolean = false;
    @Output() closeModal = new EventEmitter<void>();
    @Output() servicioConcluido = new EventEmitter<ServiceRequest>();

    private supabase = inject(SupabaseService);

    paso = signal(1); // 1: Foto, 2: Firma, 3: PIN
    isProcessing = signal(false);
    errorMessage = signal('');

    // Evidence states
    fotoImg = signal<string | null>(null);
    latitud = signal<number | null>(null);
    longitud = signal<number | null>(null);

    // Signature Canvas
    @ViewChild('signatureCanvas') canvas!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;

    // PIN
    pinDigits = signal<string[]>(['', '', '', '']);

    ngAfterViewInit() {
        // Canvas initialization happens when step 2 is active
    }

    initCanvas() {
        if (!this.canvas) return;
        const canvasEl = this.canvas.nativeElement;
        this.ctx = canvasEl.getContext('2d')!;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        // Resize for high DPI
        const rect = canvasEl.getBoundingClientRect();
        canvasEl.width = rect.width * devicePixelRatio;
        canvasEl.height = rect.height * devicePixelRatio;
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    // --- STEP 1: PHOTO & GPS ---
    async capturarFoto(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => this.fotoImg.set(e.target.result);
            reader.readAsDataURL(file);

            // Get Location automatically
            this.obtenerUbicacion();
        }
    }

    obtenerUbicacion() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.latitud.set(pos.coords.latitude);
                    this.longitud.set(pos.coords.longitude);
                },
                (err) => console.warn('Error obteniendo ubicación', err)
            );
        }
    }

    siguientePaso() {
        if (this.paso() === 1 && !this.fotoImg()) {
            this.errorMessage.set('Debes tomar una foto de evidencia');
            return;
        }

        this.paso.update(p => p + 1);
        if (this.paso() === 2) {
            setTimeout(() => this.initCanvas(), 100);
        }
        this.errorMessage.set('');
    }

    // --- STEP 2: SIGNATURE ---
    startDrawing(event: MouseEvent | TouchEvent) {
        this.isDrawing = true;
        const pos = this.getPos(event);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        event.preventDefault();
    }

    draw(event: MouseEvent | TouchEvent) {
        if (!this.isDrawing) return;
        const pos = this.getPos(event);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        event.preventDefault();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearSignature() {
        this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }

    private getPos(event: MouseEvent | TouchEvent) {
        const rect = this.canvas.nativeElement.getBoundingClientRect();
        const clientX = (event as MouseEvent).clientX || (event as TouchEvent).touches[0].clientX;
        const clientY = (event as MouseEvent).clientY || (event as TouchEvent).touches[0].clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // --- STEP 3: PIN ---
    onPinInput(event: any, index: number) {
        const val = event.target.value;
        if (val && !/^\d$/.test(val)) {
            event.target.value = '';
            return;
        }
        const current = this.pinDigits();
        current[index] = val;
        this.pinDigits.set([...current]);

        if (val && index < 3) {
            const next = event.target.nextElementSibling;
            if (next) next.focus();
        }
    }

    // --- FINALIZATION ---
    async finalizar() {
        if (this.pinDigits().some(d => d === '')) {
            this.errorMessage.set('Ingresa el PIN de 4 dígitos');
            return;
        }

        this.isProcessing.set(true);
        this.errorMessage.set('');

        try {
            const client = this.supabase.getClient();
            const pinStr = this.pinDigits().join('');

            // 1. Validar PIN
            if (this.solicitud?.pin_validacion !== pinStr) {
                throw new Error('PIN de validación incorrecto');
            }

            const userId = this.solicitud.proveedor_usuario_id;
            const timestamp = Date.now();

            // 2. Subir Foto
            let fotoUrl = null;
            if (this.fotoImg()) {
                const blob = await fetch(this.fotoImg()!).then(r => r.blob());
                const filePath = `${this.solicitud.id}/evidencia_foto_${timestamp}.jpg`;
                fotoUrl = await this.supabase.uploadFile('festeasy', filePath, new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
            }

            // 3. Subir Firma
            const firmaData = this.canvas.nativeElement.toDataURL('image/png');
            const firmaBlob = await fetch(firmaData).then(r => r.blob());
            const firmaPath = `${this.solicitud.id}/evidencia_firma_${timestamp}.png`;
            const firmaUrl = await this.supabase.uploadFile('festeasy', firmaPath, new File([firmaBlob], 'firma.png', { type: 'image/png' }));

            // 4. Actualizar Solicitud
            const { data, error } = await client
                .from('solicitudes')
                .update({
                    estado: 'entregado_pendiente_liq',
                    evidencia_foto_url: fotoUrl,
                    evidencia_firma_url: firmaUrl,
                    evidencia_latitud: this.latitud(),
                    evidencia_longitud: this.longitud(),
                    finalizado_en: new Date().toISOString(),
                    fecha_validacion_pin: new Date().toISOString(),
                    actualizado_en: new Date().toISOString()
                })
                .eq('id', this.solicitud.id)
                .select()
                .single();

            if (error) throw error;

            this.servicioConcluido.emit(data);
            this.close();

        } catch (error: any) {
            this.errorMessage.set(error.message || 'Error al procesar la entrega');
        } finally {
            this.isProcessing.set(false);
        }
    }

    close() {
        this.paso.set(1);
        this.fotoImg.set(null);
        this.pinDigits.set(['', '', '', '']);
        this.closeModal.emit();
    }
}

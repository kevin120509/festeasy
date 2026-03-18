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

    // Dynamic steps management
    pasoActualIndex = signal(0);
    steps = signal<string[]>([]); // 'foto', 'firma_prov', 'firma_clie', 'pin'

    isProcessing = signal(false);
    errorMessage = signal('');

    // Evidence states
    fotoImg = signal<string | null>(null);
    firmaProvImg = signal<string | null>(null);
    firmaClieImg = signal<string | null>(null);
    latitud = signal<number | null>(null);
    longitud = signal<number | null>(null);

    // Signature Canvas
    @ViewChild('signatureCanvas') canvas!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;

    // PIN
    pinDigits = signal<string[]>(['', '', '', '']);

    ngAfterViewInit() {
        this.initSteps();
    }

    ngOnChanges() {
        if (this.isOpen) {
            this.initSteps();
        }
    }

    initSteps() {
        if (!this.solicitud?.provider) return;

        const config = this.solicitud.provider.ajustes_entrega_json;
        const pasos: string[] = [];

        const req_foto = config?.requiere_foto ?? true;
        const req_firma_prov = config?.requiere_firma_proveedor ?? false;
        const req_firma_clie = config?.requiere_firma_cliente ?? true;
        const req_pin = config?.requiere_pin ?? true;

        if (req_foto) pasos.push('foto');
        if (req_firma_prov) pasos.push('firma_prov');
        if (req_firma_clie) pasos.push('firma_clie');
        if (req_pin) pasos.push('pin');

        // Si no hay ningún paso técnico configurado, añadimos uno de confirmación simple
        // para que el modal no esté vacío y permita finalizar.
        if (pasos.length === 0) {
            pasos.push('confirmar');
        }

        this.steps.set(pasos);
        this.pasoActualIndex.set(0);
        console.log('🏁 Pasos configurados para la entrega:', pasos);
    }

    getPasoActual() {
        return this.steps()[this.pasoActualIndex()];
    }

    initCanvas() {
        setTimeout(() => {
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
        }, 100);
    }

    // --- PHOTO ---
    async capturarFoto(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => this.fotoImg.set(e.target.result);
            reader.readAsDataURL(file);
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
        const actual = this.getPasoActual();

        // Validaciones por paso
        if (actual === 'foto' && !this.fotoImg()) {
            this.errorMessage.set('Debes tomar una foto de evidencia');
            return;
        }

        if (actual === 'firma_prov' || actual === 'firma_clie') {
            if (this.canvas) {
                const imgData = this.canvas.nativeElement.toDataURL('image/png');
                if (actual === 'firma_prov') this.firmaProvImg.set(imgData);
                else this.firmaClieImg.set(imgData);
            }
        }

        if (this.pasoActualIndex() < this.steps().length - 1) {
            this.pasoActualIndex.update(i => i + 1);
            const nuevoPaso = this.getPasoActual();
            if (nuevoPaso === 'firma_prov' || nuevoPaso === 'firma_clie') {
                this.initCanvas();
            }
            this.errorMessage.set('');
        }
    }

    anteriorPaso() {
        if (this.pasoActualIndex() > 0) {
            this.pasoActualIndex.update(i => i - 1);
            const actual = this.getPasoActual();
            if (actual === 'firma_prov' || actual === 'firma_clie') {
                this.initCanvas();
            }
        }
    }

    // --- CANVAS ACTIONS ---
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
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        }
        if (this.getPasoActual() === 'firma_prov') this.firmaProvImg.set(null);
        else this.firmaClieImg.set(null);
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

    // --- PIN ---
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
        const actual = this.getPasoActual();
        if (actual === 'pin' && this.pinDigits().some(d => d === '')) {
            this.errorMessage.set('Ingresa el PIN de 4 dígitos');
            return;
        }

        this.isProcessing.set(true);
        this.errorMessage.set('');

        try {
            const client = this.supabase.getClient();

            // 1. Validar PIN solo si se requiere
            if (this.steps().includes('pin')) {
                const pinStr = this.pinDigits().join('');
                if (this.solicitud?.pin_validacion !== pinStr) {
                    throw new Error('PIN de validación incorrecto');
                }
            }

            const timestamp = Date.now();

            // 2. Subidas en paralelo
            const uploadPromises = [];

            if (this.fotoImg()) {
                uploadPromises.push((async () => {
                    const blob = await fetch(this.fotoImg()!).then(r => r.blob());
                    const path = `${this.solicitud?.id}/evidencia_foto_${timestamp}.jpg`;
                    return { key: 'evidencia_foto_url', url: await this.supabase.uploadFile('festeasy', path, new File([blob], 'foto.jpg', { type: 'image/jpeg' })) };
                })());
            }

            if (this.firmaClieImg()) {
                uploadPromises.push((async () => {
                    const blob = await fetch(this.firmaClieImg()!).then(r => r.blob());
                    const path = `${this.solicitud?.id}/evidencia_firma_cliente_${timestamp}.png`;
                    return { key: 'evidencia_firma_url', url: await this.supabase.uploadFile('festeasy', path, new File([blob], 'firma_cliente.png', { type: 'image/png' })) };
                })());
            }

            if (this.firmaProvImg()) {
                uploadPromises.push((async () => {
                    const blob = await fetch(this.firmaProvImg()!).then(r => r.blob());
                    const path = `${this.solicitud?.id}/evidencia_firma_proveedor_${timestamp}.png`;
                    return { key: 'evidencia_firma_proveedor_url', url: await this.supabase.uploadFile('festeasy', path, new File([blob], 'firma_proveedor.png', { type: 'image/png' })) };
                })());
            }

            const results = await Promise.all(uploadPromises);
            const updateData: any = {
                estado: 'entregado_pendiente_liq',
                evidencia_latitud: this.latitud(),
                evidencia_longitud: this.longitud(),
                finalizado_en: new Date().toISOString(),
                actualizado_en: new Date().toISOString()
            };

            results.forEach(res => updateData[res.key] = res.url);
            if (this.steps().includes('pin')) updateData.fecha_validacion_pin = new Date().toISOString();

            // 4. Actualizar Solicitud
            const { data, error } = await client
                .from('solicitudes')
                .update(updateData)
                .eq('id', this.solicitud?.id)
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
        this.pasoActualIndex.set(0);
        this.fotoImg.set(null);
        this.firmaProvImg.set(null);
        this.firmaClieImg.set(null);
        this.pinDigits.set(['', '', '', '']);
        this.closeModal.emit();
    }
}

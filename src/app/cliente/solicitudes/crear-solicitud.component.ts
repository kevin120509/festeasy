import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-crear-solicitud',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './crear-solicitud.component.html',
    styleUrls: ['./crear-solicitud.component.css']
})
export class CrearSolicitudComponent {
    private fb = inject(FormBuilder);
    private api = inject(ApiService);
    private router = inject(Router);
    private auth = inject(AuthService);

    currentStep = 1;
    isLoading = false;

    // Formulario principal que agrupa todo
    solicitudForm: FormGroup = this.fb.group({
        // Paso 1: Detalles
        titulo_evento: ['', Validators.required],
        fecha_servicio: ['', Validators.required],
        hora_servicio: ['12:00', Validators.required],
        ubicacion: ['', Validators.required],
        invitados: [50, [Validators.required, Validators.min(1)]],

        // Paso 2: Requerimientos
        descripcion: ['', Validators.required],
        presupuesto: [0],
        servicios_adicionales: this.fb.group({
            montaje: [false],
            limpieza: [false],
            iluminacion: [false],
            sonido: [false],
            foto: [false],
            catering: [false]
        })
    });

    // Datos simulados para "Evento Existente" (Dropdown)
    eventos = [
        { id: 1, nombre: 'Graduación 2024 - Junio 15' },
        { id: 2, nombre: 'Cumpleaños Mariana' },
        { id: 3, nombre: 'Boda Civil' }
    ];

    nextStep() {
        // Validar paso actual antes de avanzar
        if (this.currentStep === 1) {
            const controls = ['titulo_evento', 'fecha_servicio', 'hora_servicio', 'ubicacion', 'invitados'];
            const valid = controls.every(c => this.solicitudForm.get(c)?.valid);

            if (!valid) {
                this.solicitudForm.markAllAsTouched();
                return;
            }
        }

        this.currentStep++;
        window.scrollTo(0, 0);
    }

    prevStep() {
        this.currentStep--;
        window.scrollTo(0, 0);
    }

    submit() {
        if (this.solicitudForm.invalid) {
            this.solicitudForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const formValue = this.solicitudForm.value;

        // Construir objeto para el backend
        const solicitudData = {
            cliente_usuario_id: this.auth.currentUser()?.id, // ID del cliente logueado
            proveedor_usuario_id: '9851a62f-92db-41e8-b430-b68a3d46b578', // FIXME: Debería venir de la selección previa o ser nulo si es broadcast
            titulo_evento: formValue.titulo_evento,
            fecha_servicio: new Date(`${formValue.fecha_servicio}T${formValue.hora_servicio}`).toISOString(),
            direccion_servicio: formValue.ubicacion,
            // Metadata adicional que podríamos guardar en un campo JSON si la DB lo soporta,
            // o concatenar en la descripción/título por ahora ya que el modelo es simple
            longitud_servicio: 0,
            latitud_servicio: 0
        };

        console.log('Enviando solicitud:', solicitudData);

        this.api.createRequest(solicitudData).subscribe({
            next: (res) => {
                console.log('Solicitud creada:', res);
                this.isLoading = false;
                // Redirigir a "Mis Solicitudes" o éxito
                alert('¡Solicitud enviada con éxito!');
                this.router.navigate(['/cliente/dashboard']);
            },
            error: (err) => {
                console.error('Error:', err);
                this.isLoading = false;
                alert('Error al crear la solicitud. Verifica la consola.');
            }
        });
    }
}

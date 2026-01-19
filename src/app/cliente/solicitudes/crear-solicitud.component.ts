import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-crear-solicitud',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './crear-solicitud.component.html',
    styleUrls: ['./crear-solicitud.component.css']
})
export class CrearSolicitudComponent implements OnInit {
    private fb = inject(FormBuilder);
    private api = inject(ApiService);
    private router = inject(Router);
    private auth = inject(AuthService);
    private supabase = inject(SupabaseService);

    isLoading = false;

    // Formulario principal que agrupa todo
    solicitudForm: FormGroup = this.fb.group({
        // Paso 1: Detalles (Ahora único paso)
        fecha_servicio: ['', Validators.required],
        hora_servicio: ['12:00', Validators.required],
        ubicacion: ['', Validators.required],
        invitados: [50, [Validators.required, Validators.min(1)]]
    });

    private route = inject(ActivatedRoute);

    ngOnInit() {
        // Leer ID del proveedor de la URL si existe (ej: /cliente/solicitudes/crear?providerId=123)
        this.route.queryParams.subscribe(params => {
            // Logic if needed in future
        });
    }

    goToMarketplace() {
        // Validar antes de ir (opcional, pero buena práctica)
        if (this.solicitudForm.invalid) {
            this.solicitudForm.markAllAsTouched();
            return;
        }

        // Aquí podríamos guardar los datos del evento en un servicio para usarlos en el marketplace
        // Por ejemplo: this.eventService.setCurrentEvent(this.solicitudForm.value);
        
        console.log('Navegando al marketplace con contexto:', this.solicitudForm.value);
        this.router.navigate(['/cliente/marketplace']);
    }
}

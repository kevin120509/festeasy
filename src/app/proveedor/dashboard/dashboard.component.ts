import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ServiceRequest, Payment } from '../../models';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-proveedor-dashboard',
    standalone: true,
    imports: [RouterLink, CommonModule, DatePipe, CurrencyPipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class ProveedorDashboardComponent implements OnInit {
    auth = inject(AuthService);
    supabaseData = inject(SupabaseDataService);

    metricas = signal({
        nuevasSolicitudes: 0,
        cotizacionesActivas: 0,
        ingresosMensuales: 0,
        porcentajeSolicitudes: 0,
        porcentajeIngresos: 0
    });

    recentRequests = signal<any[]>([]);
    recentPayments = signal<Payment[]>([]);

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        const user = this.auth.currentUser();
        if (!user || !user.id) return;

        // 1. Obtener solicitudes del proveedor
        this.supabaseData.getRequestsByProvider(user.id).subscribe({
            next: (data) => {
                this.recentRequests.set(data.slice(0, 5));

                // Calcular métricas simples
                const nuevas = data.filter(r => r.estado === 'pendiente_aprobacion').length;
                const activas = data.filter(r => ['negociacion', 'reservado', 'en_progreso'].includes(r.estado)).length;

                this.metricas.set({
                    nuevasSolicitudes: nuevas,
                    cotizacionesActivas: activas,
                    ingresosMensuales: 0, // TODO: Implementar tabla de pagos
                    porcentajeSolicitudes: 5, // Mock calc
                    porcentajeIngresos: 10
                });
            },
            error: (err) => console.error('Error loading provider data', err)
        });

        // 2. Pagos (Mock o futuro endpoint de Supabase)
        // Por ahora lo dejamos vacío o mock hasta implementar tabla pagos
    }
}

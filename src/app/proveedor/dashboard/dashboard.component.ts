import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
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
    api = inject(ApiService);

    metricas = signal({
        nuevasSolicitudes: 0,
        cotizacionesActivas: 0,
        ingresosMensuales: 0,
        porcentajeSolicitudes: 0,
        porcentajeIngresos: 0
    });

    recentRequests = signal<ServiceRequest[]>([]);
    recentPayments = signal<Payment[]>([]);

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        // 1. Métricas
        this.api.getProviderDashboardMetrics().subscribe({
            next: (data) => {
                this.metricas.set(data);
            },
            error: (err) => console.error('Error loading metrics', err)
        });

        // 2. Solicitudes Recientes
        this.api.getRecentRequests().subscribe({
            next: (data) => {
                this.recentRequests.set(data);
            },
            error: (err) => console.error('Error loading requests', err)
        });

        // 3. Pagos Recientes
        this.api.getRecentPayments().subscribe({
            next: (data) => {
                this.recentPayments.set(data);
            },
            error: (err) => console.error('Error loading payments', err)
        });
    }
}

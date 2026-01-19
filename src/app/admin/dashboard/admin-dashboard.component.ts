import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';

interface DashboardStats {
    totalUsuarios: number;
    totalProveedores: number;
    totalClientes: number;
    proveedoresPendientes: number;
    solicitudesHoy: number;
    ingresosMes: number;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
    private supabaseData = inject(SupabaseDataService);

    stats = signal<DashboardStats>({
        totalUsuarios: 0,
        totalProveedores: 0,
        totalClientes: 0,
        proveedoresPendientes: 0,
        solicitudesHoy: 0,
        ingresosMes: 0
    });

    isLoading = signal(true);
    
    // Actividad reciente mock
    actividadReciente = signal([
        { tipo: 'nuevo_proveedor', mensaje: 'Nuevo proveedor registrado: DJ Fiesta Total', tiempo: 'Hace 5 min', icono: 'person_add' },
        { tipo: 'solicitud', mensaje: 'Nueva solicitud de cotización recibida', tiempo: 'Hace 15 min', icono: 'request_quote' },
        { tipo: 'pago', mensaje: 'Pago confirmado: $5,000 MXN', tiempo: 'Hace 1 hora', icono: 'payments' },
        { tipo: 'reseña', mensaje: 'Nueva reseña 5 estrellas para Catering Deluxe', tiempo: 'Hace 2 horas', icono: 'star' },
    ]);

    ngOnInit(): void {
        this.cargarEstadisticas();
    }

    async cargarEstadisticas() {
        this.isLoading.set(true);
        try {
            // TODO: Implementar llamadas reales a Supabase para obtener estadísticas
            // Por ahora usamos datos de ejemplo
            setTimeout(() => {
                this.stats.set({
                    totalUsuarios: 156,
                    totalProveedores: 42,
                    totalClientes: 114,
                    proveedoresPendientes: 5,
                    solicitudesHoy: 12,
                    ingresosMes: 125000
                });
                this.isLoading.set(false);
            }, 500);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.isLoading.set(false);
        }
    }
}

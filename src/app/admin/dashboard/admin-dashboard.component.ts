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
    todosProveedores = signal<any[]>([]);

    // Actividad reciente real
    actividadReciente = signal<any[]>([]);

    ngOnInit(): void {
        this.cargarDatosDashboard();
    }

    async cargarDatosDashboard() {
        this.isLoading.set(true);
        try {
            const [estatisticas, actividad, proveedores] = await Promise.all([
                this.supabaseData.getAdminDashboardStats(),
                this.supabaseData.getRecentAdminActivity(),
                this.supabaseData.getAllProvidersDetailed()
            ]);

            this.stats.set(estatisticas);
            this.actividadReciente.set(actividad);
            this.todosProveedores.set(proveedores);

            this.isLoading.set(false);
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            this.isLoading.set(false);
        }
    }

    formatearFechaRelativa(fecha: string) {
        const date = new Date(fecha);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
        return date.toLocaleDateString();
    }
}

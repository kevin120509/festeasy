import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';

@Component({
    selector: 'app-cliente-dashboard',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './dashboard.html'
})
export class ClienteDashboardComponent implements OnInit {
    auth = inject(AuthService);
    supabaseData = inject(SupabaseDataService);

    // Métricas
    metricas = signal({
        solicitudesTotales: 0,
        cotizacionesPendientes: 0
    });

    // Actividad reciente (solicitudes)
    actividades = signal<any[]>([]);

    // Categorías de solicitudes
    reservadas = signal<any[]>([]);
    pendientesPago = signal<any[]>([]);
    pendientesRespuesta = signal<any[]>([]);

    // Tab activo
    activeTab = signal<'reservadas' | 'por_pagar' | 'pendientes'>('reservadas');

    // Todas las solicitudes del cliente
    misSolicitudes = signal<any[]>([]);

    loading = signal(true);

    ngOnInit(): void {
        this.cargarDatos();
    }

    async cargarDatos(): Promise<void> {
        // Esperar a que la sesión esté lista
        const ok = await this.auth.waitForAuth();
        if (!ok) {
            this.loading.set(false);
            return;
        }

        const user = this.auth.currentUser();
        if (!user || !user.id) {
            this.loading.set(false);
            return;
        }

        this.supabaseData.getRequestsByClient(user.id).subscribe({
            next: (requests) => {
                this.misSolicitudes.set(requests);

                // Mapear a actividades para la tabla
                const mappedRequests = requests.map(req => ({
                    id: req.id,
                    proveedor: req.perfil_proveedor?.nombre_negocio || 'Proveedor',
                    servicio: req.titulo_evento || 'Evento Especial',
                    fecha: new Date(req.fecha_servicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                    estado: req.estado,
                    estadoLabel: this.formatEstado(req.estado),
                    monto: req.monto_total || 0,
                    // Additional fields for reserved view
                    hora: req.hora_servicio || '12:00',
                    direccion: req.direccion_servicio || 'Ubicación no disponible'
                }));
                
                this.actividades.set(mappedRequests);

                // Categorizar
                this.reservadas.set(mappedRequests.filter(r => ['reservado', 'en_progreso', 'entregado_pendiente_liq', 'finalizado'].includes(r.estado)));
                this.pendientesPago.set(mappedRequests.filter(r => r.estado === 'esperando_anticipo'));
                this.pendientesRespuesta.set(mappedRequests.filter(r => r.estado === 'pendiente_aprobacion'));

                // Calcular Métricas
                const pendientes = requests.filter(r => r.estado === 'pendiente_aprobacion').length;

                this.metricas.set({
                    solicitudesTotales: requests.length,
                    cotizacionesPendientes: pendientes
                });

                // Set initial tab based on content priority
                if (this.reservadas().length > 0) this.activeTab.set('reservadas');
                else if (this.pendientesPago().length > 0) this.activeTab.set('por_pagar');
                else this.activeTab.set('pendientes');

                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
                this.loading.set(false);
            }
        });
    }

    setActiveTab(tab: 'reservadas' | 'por_pagar' | 'pendientes') {
        this.activeTab.set(tab);
    }

    formatEstado(estado: string): string {
        const estados: Record<string, string> = {
            'pendiente_aprobacion': 'Pendiente',
            'esperando_anticipo': 'Esperando anticipo',
            'reservado': 'Reservado',
            'en_progreso': 'En progreso',
            'rechazada': 'Rechazado',
            'finalizado': 'Completado',
            'cancelada': 'Cancelado'
        };
        return estados[estado] || estado;
    }

    getEstadoClass(estado: string): string {
        const clases: Record<string, string> = {
            'pendiente_aprobacion': 'estado-pendiente',
            'esperando_anticipo': 'estado-reservado',
            'reservado': 'estado-reservado',
            'en_progreso': 'estado-progreso',
            'rechazada': 'estado-rechazado',
            'finalizado': 'estado-completado',
            'cancelada': 'estado-cancelado'
        };
        return clases[estado] || 'estado-pendiente';
    }

    getUserName(): string {
        const user = this.auth.currentUser();
        return user?.nombre || user?.email || user?.correo_electronico || 'Usuario';
    }
}
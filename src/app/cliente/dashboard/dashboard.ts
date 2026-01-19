import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-cliente-dashboard',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './dashboard.html'
})
export class ClienteDashboardComponent implements OnInit {
    auth = inject(AuthService);
    api = inject(ApiService);

    // Métricas
    metricas = signal({
        eventosActivos: 0,
        cotizacionesPendientes: 0,
        inversionTotal: 0
    });

    // Evento activo (el más próximo)
    eventoActivo = signal<any>(null);

    // Actividad reciente (solicitudes)
    actividades = signal<any[]>([]);

    // Todas las solicitudes del cliente
    misSolicitudes = signal<any[]>([]);

    // Proveedores recomendados
    recomendados = signal([
        { id: '1', nombre: 'Artes Florales', rating: 4.9, resenas: 120, icono: '🌸' },
        { id: '2', nombre: 'Pastelería Royal', rating: 4.7, resenas: 85, icono: '🎂' },
        { id: '3', nombre: 'DJ Sounds Pro', rating: 4.8, resenas: 92, icono: '🎵' }
    ]);

    // Tareas pendientes
    tareas = signal([
        { id: '1', texto: 'Confirmar lista de invitados', completada: false },
        { id: '2', texto: 'Revisar cotizaciones pendientes', completada: false },
        { id: '3', texto: 'Elegir paleta de colores', completada: false }
    ]);

    loading = signal(true);
    darkMode = signal(false);

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.api.getClientRequests().subscribe({
            next: (requests) => {
                // Guardar todas las solicitudes
                this.misSolicitudes.set(requests);

                // Mapear solicitudes a actividades
                const actividades = requests.slice(0, 5).map(req => ({
                    id: req.id,
                    proveedor: 'Proveedor',
                    servicio: req.titulo_evento || 'Servicio',
                    fecha: new Date(req.fecha_servicio).toLocaleDateString('es-MX'),
                    estado: req.estado,
                    estadoLabel: this.formatEstado(req.estado),
                    monto: 0,
                    icono: '📋'
                }));
                this.actividades.set(actividades);

                // Métricas
                const pendientes = requests.filter(r => r.estado === 'pendiente_aprobacion').length;
                this.metricas.set({
                    eventosActivos: requests.filter(r => ['reservado', 'en_progreso'].includes(r.estado)).length,
                    cotizacionesPendientes: pendientes,
                    inversionTotal: 0
                });

                // Evento activo (primera solicitud reservada)
                const activo = requests.find(r => r.estado === 'reservado');
                if (activo) {
                    this.eventoActivo.set({
                        id: activo.id,
                        titulo: activo.titulo_evento || 'Mi Evento',
                        ubicacion: activo.direccion_servicio,
                        fecha: new Date(activo.fecha_servicio).toLocaleDateString('es-MX'),
                        progreso: 65
                    });
                }

                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    formatEstado(estado: string): string {
        const estados: Record<string, string> = {
            'pendiente_aprobacion': 'Pendiente',
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
            'reservado': 'estado-reservado',
            'en_progreso': 'estado-progreso',
            'rechazada': 'estado-rechazado',
            'finalizado': 'estado-completado',
            'cancelada': 'estado-cancelado'
        };
        return clases[estado] || 'estado-pendiente';
    }

    toggleTarea(id: string): void {
        this.tareas.update(tareas =>
            tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t)
        );
    }

    toggleDarkMode(): void {
        this.darkMode.update(v => !v);
    }

    getUserName(): string {
        const user = this.auth.currentUser();
        return user?.nombre || user?.correo_electronico?.split('@')[0] || 'Usuario';
    }
}

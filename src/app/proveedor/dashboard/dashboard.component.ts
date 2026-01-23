import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';
import { ValidarPin } from '../validar-pin/validar-pin';

// Interface para las solicitudes de la tabla
interface RequestRow {
    id: string;
    evento: string;
    ubicacion: string;
    fechaServicio: Date;
    estado: 'esperando_anticipo' | 'reservado' | 'pendiente';
    monto?: number;
    cliente_nombre?: string;
}

@Component({
    selector: 'app-proveedor-dashboard',
    standalone: true,
    imports: [RouterLink, CommonModule, DatePipe, CurrencyPipe, ValidarPin],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class ProveedorDashboardComponent implements OnInit {
    // Servicios
    private auth = inject(AuthService);
    private supabaseData = inject(SupabaseDataService);
    private router = inject(Router);

    // Fecha actual formateada
    fechaHoy = new Date();

    // Estado de carga
    isLoading = signal(true);
    hasError = signal(false);
    errorMessage = signal('');

    // Estadísticas calculadas desde Supabase
    stats = signal({
        nuevasSolicitudes: 0,
        nuevasSolicitudesHoy: 0,
        eventosConfirmados: 0,
        gananciasTotales: 0
    });

    // Próxima cita destacada (calculada desde las solicitudes)
    proximaCita = signal<any>(null);

    // Solicitudes recientes desde Supabase
    solicitudesRecientes = signal<RequestRow[]>([]);

    // Control del menú desplegable
    menuAbierto = signal<string | null>(null);

    // Control del modal de validación de PIN
    mostrarModalPin = signal(false);
    solicitudSeleccionada = signal<string>('');

    async ngOnInit() {
        await this.cargarDatosDashboard();
    }

    /**
     * Método principal para cargar todos los datos del dashboard
     */
    async cargarDatosDashboard() {
        try {
            this.isLoading.set(true);
            this.hasError.set(false);

            // 1. Obtener el usuario actual (proveedor)
            const user = this.auth.currentUser();
            if (!user || !user.id) {
                throw new Error('Usuario no autenticado. Por favor inicia sesión.');
            }

            console.log('📊 Cargando dashboard para proveedor:', user.id);

            // 2. Obtener todas las solicitudes del proveedor desde Supabase
            const solicitudes = await this.obtenerSolicitudesProveedor(user.id);

            // 3. Calcular métricas
            this.calcularMetricas(solicitudes);

            // 4. Procesar solicitudes para la tabla
            this.procesarSolicitudesTabla(solicitudes);

            // 5. Calcular próxima cita
            this.calcularProximaCita(solicitudes);

            // 6. Opcional: Obtener ganancias desde tabla pagos
            await this.calcularGanancias(user.id);

            console.log('✅ Dashboard cargado exitosamente');

        } catch (error: any) {
            console.error('❌ Error al cargar dashboard:', error);
            this.hasError.set(true);
            this.errorMessage.set(error.message || 'Error al cargar los datos del dashboard');
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Obtener solicitudes del proveedor desde Supabase
     */
    private async obtenerSolicitudesProveedor(providerId: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.supabaseData.getRequestsByProvider(providerId).subscribe({
                next: (data) => {
                    console.log(`📋 Solicitudes obtenidas: ${data.length}`);
                    resolve(data || []);
                },
                error: (err) => {
                    console.error('Error al obtener solicitudes:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * Calcular métricas desde las solicitudes
     */
    private calcularMetricas(solicitudes: any[]) {
        // Nuevas solicitudes: estado 'pendiente_aprobacion' o 'pendiente'
        const nuevas = solicitudes.filter(s =>
            s.estado === 'pendiente_aprobacion' || s.estado === 'pendiente'
        ).length;

        // Solicitudes nuevas de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const nuevasHoy = solicitudes.filter(s => {
            const fechaCreacion = new Date(s.creado_en);
            fechaCreacion.setHours(0, 0, 0, 0);
            return fechaCreacion.getTime() === hoy.getTime() &&
                (s.estado === 'pendiente_aprobacion' || s.estado === 'pendiente');
        }).length;

        // Eventos confirmados: estado 'reservado', 'pagado', etc.
        const confirmados = solicitudes.filter(s => {
            const estado = s.estado?.toLowerCase();
            return ['reservado', 'pagado', 'en_progreso', 'aceptado', 'confirmado'].includes(estado);
        }).length;

        this.stats.update(stats => ({
            ...stats,
            nuevasSolicitudes: nuevas,
            nuevasSolicitudesHoy: nuevasHoy,
            eventosConfirmados: confirmados
        }));

        console.log('📊 Métricas calculadas:', this.stats());
    }

    /**
     * Procesar solicitudes para mostrar en la tabla
     */
    private procesarSolicitudesTabla(solicitudes: any[]) {
        const solicitudesFormateadas: RequestRow[] = solicitudes
            .slice(0, 5) // Últimas 5 solicitudes
            .map(req => ({
                id: req.id || '',
                evento: req.titulo_evento || 'Evento General',
                ubicacion: req.direccion_servicio || 'Ubicación no especificada',
                fechaServicio: new Date(req.fecha_servicio),
                estado: this.mapEstado(req.estado),
                monto: req.monto_total || req.monto,
                cliente_nombre: req.perfil_cliente?.nombre_completo || 'Cliente'
            }));

        this.solicitudesRecientes.set(solicitudesFormateadas);
        console.log('📋 Solicitudes para tabla:', solicitudesFormateadas.length);
    }

    private calcularProximaCita(solicitudes: any[]) {
        const ahora = new Date();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // 1. Filtrar solicitudes confirmadas
        const confirmados = solicitudes.filter(s => {
            const estado = s.estado?.toLowerCase();
            return ['reservado', 'pagado', 'en_progreso', 'aceptado', 'confirmado'].includes(estado);
        });

        if (confirmados.length === 0) {
            this.setSinEventos();
            return;
        }

        // 2. Buscar el evento más cercano (hoy o futuro)
        const proximos = confirmados
            .filter(s => {
                const fechaEvento = new Date(s.fecha_servicio);
                fechaEvento.setHours(0, 0, 0, 0);
                return fechaEvento.getTime() >= hoy.getTime();
            })
            .sort((a, b) => new Date(a.fecha_servicio).getTime() - new Date(b.fecha_servicio).getTime());

        if (proximos.length > 0) {
            this.setProximaCitaData(proximos[0]);
            console.log('📅 Próxima cita (futura o hoy):', proximos[0]);
            return;
        }

        // 3. Si no hay futuros, mostrar el más reciente aunque sea pasado
        // (Para que el dashboard no se vea vacío justo después de un evento)
        const pasados = confirmados
            .sort((a, b) => new Date(b.fecha_servicio).getTime() - new Date(a.fecha_servicio).getTime());

        if (pasados.length > 0) {
            this.setProximaCitaData(pasados[0]);
            console.log('📅 Mostrando evento más reciente (pasado):', pasados[0]);
        } else {
            this.setSinEventos();
        }
    }

    private setProximaCitaData(proximo: any) {
        this.proximaCita.set({
            id: proximo.id,
            titulo: proximo.titulo_evento || 'Evento',
            ubicacion: proximo.direccion_servicio || 'Ubicación por confirmar',
            fecha: new Date(proximo.fecha_servicio),
            montoTotal: proximo.monto_total || proximo.monto || 0,
            imagenMapa: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=200&fit=crop'
        });
    }

    private setSinEventos() {
        this.proximaCita.set({
            id: null,
            titulo: 'Sin eventos próximos',
            ubicacion: 'No hay citas confirmadas',
            fecha: new Date(),
            montoTotal: 0,
            imagenMapa: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop'
        });
    }

    /**
     * Calcular ganancias totales desde la tabla pagos
     * (Si la tabla pagos existe en tu BD)
     */
    private async calcularGanancias(providerId: string) {
        try {
            // Esta consulta asume que tienes una tabla 'pagos' con una columna 'proveedor_id' y 'monto'
            // Si no tienes esta tabla, puedes comentar este método o calcular desde solicitudes

            // Por ahora, simulamos las ganancias sumando los montos de solicitudes confirmadas
            const solicitudes = this.solicitudesRecientes();
            const gananciasTotales = solicitudes
                .filter(s => s.estado === 'reservado')
                .reduce((sum, s) => sum + (s.monto || 0), 0);

            this.stats.update(stats => ({
                ...stats,
                gananciasTotales: gananciasTotales
            }));

            // TODO: Implementar consulta real a tabla 'pagos' cuando esté disponible
            // const { data, error } = await this.supabase
            //     .from('pagos')
            //     .select('monto')
            //     .eq('proveedor_id', providerId)
            //     .eq('estado', 'completado');
            // 
            // if (!error && data) {
            //     const total = data.reduce((sum, pago) => sum + pago.monto, 0);
            //     this.stats.update(stats => ({ ...stats, gananciasTotales: total }));
            // }

        } catch (error) {
            console.warn('⚠️ No se pudieron calcular las ganancias:', error);
            // No lanzamos error para no romper el dashboard
        }
    }

    /**
     * Mapear estado de Supabase a estado de la UI
     */
    private mapEstado(estado: string): 'esperando_anticipo' | 'reservado' | 'pendiente' {
        const estadosMap: Record<string, 'esperando_anticipo' | 'reservado' | 'pendiente'> = {
            'reservado': 'reservado',
            'aceptado': 'reservado',
            'pendiente_aprobacion': 'pendiente',
            'pendiente': 'pendiente',
            'en_negociacion': 'esperando_anticipo',
            'esperando_anticipo': 'esperando_anticipo'
        };
        return estadosMap[estado] || 'pendiente';
    }

    /**
     * Obtener clases CSS para badges de estado
     */
    getEstadoClasses(estado: string): string {
        const clases = {
            'esperando_anticipo': 'bg-orange-50 text-orange-600 border border-orange-100',
            'reservado': 'bg-blue-50 text-blue-600 border border-blue-100',
            'pendiente': 'bg-yellow-50 text-yellow-600 border border-yellow-100'
        };
        return clases[estado as keyof typeof clases] || clases.pendiente;
    }

    /**
     * Obtener texto legible para estados
     */
    getEstadoTexto(estado: string): string {
        const textos = {
            'esperando_anticipo': 'Esperando Anticipo',
            'reservado': 'Reservado',
            'pendiente': 'Pendiente'
        };
        return textos[estado as keyof typeof textos] || 'Pendiente';
    }

    /**
     * Toggle menú desplegable de acciones
     */
    toggleMenu(id: string) {
        this.menuAbierto.set(this.menuAbierto() === id ? null : id);
    }

    /**
     * Ver detalles de una solicitud
     */
    verDetalles(id: string) {
        if (!id) return;
        console.log('Navegando a detalles de solicitud:', id);
        this.router.navigate(['/proveedor/solicitudes', id]);
        this.menuAbierto.set(null);
    }

    /**
     * Editar solicitud
     */
    editarSolicitud(id: string) {
        console.log('Editar solicitud:', id);
        // TODO: Navegar a formulario de edición
        this.menuAbierto.set(null);
    }

    /**
     * Rechazar solicitud
     */
    async rechazarSolicitud(id: string) {
        try {
            console.log('Rechazando solicitud:', id);
            await this.supabaseData.updateRequestStatus(id, 'rechazada');
            await this.cargarDatosDashboard();
            this.menuAbierto.set(null);
        } catch (error: unknown) {
            console.error('Error al rechazar solicitud:', error);
            alert('Error al rechazar la solicitud. Intenta de nuevo.');
        }
    }

    /**
     * Obtener nombre del negocio del proveedor
     */
    getNombreNegocio(): string {
        const user = this.auth.currentUser();
        return user?.nombre_negocio || user?.nombre || 'Proveedor';
    }

    /**
     * Abrir modal de validación de PIN para una solicitud específica
     */
    abrirModalPin(solicitudId?: string) {
        if (solicitudId) {
            this.solicitudSeleccionada.set(solicitudId);
            this.mostrarModalPin.set(true);
        } else {
            // Si no se proporciona ID, usar la próxima cita
            const proximaCita = this.proximaCita();
            if (proximaCita && proximaCita.id) {
                this.solicitudSeleccionada.set(proximaCita.id);
                this.mostrarModalPin.set(true);
            } else {
                alert('No hay solicitudes disponibles para validar');
            }
        }
    }

    /**
     * Cerrar modal de validación de PIN
     */
    cerrarModalPin() {
        this.mostrarModalPin.set(false);
        this.solicitudSeleccionada.set('');
    }

    /**
     * Manejar PIN validado exitosamente
     */
    async onPinValidado(solicitud: any) {
        console.log('✅ PIN validado exitosamente para solicitud:', solicitud);
        // Recargar datos del dashboard
        await this.cargarDatosDashboard();
    }
}

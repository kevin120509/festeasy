import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';
import { ValidarPin } from '../validar-pin/validar-pin';
import { ResenasService } from '../../services/resenas.service';

// Interface para las solicitudes de la tabla
interface RequestRow {
    id: string;
    evento: string;
    ubicacion: string;
    fechaServicio: Date;
    estado: string;
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
    private resenasService = inject(ResenasService);
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
        gananciasTotales: 0,
        ratingPromedio: 0,
        totalResenas: 0
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

    // Tab activo para filtrar solicitudes
    tabActivo = signal<string>('todos');

    // Solicitudes agrupadas por categoría de estado
    solicitudesAgrupadas = computed(() => {
        const all = this.solicitudesRecientes();
        const groups: { key: string; label: string; icon: string; color: string; items: RequestRow[] }[] = [];

        const pendientes = all.filter(s => s.estado === 'pendiente_aprobacion' || s.estado === 'pendiente');
        const negociacion = all.filter(s => s.estado === 'en_negociacion');
        const reservados = all.filter(s => ['reservado', 'esperando_anticipo'].includes(s.estado));
        const activos = all.filter(s => ['en_progreso', 'entregado_pendiente_liq', 'esperando_confirmacion_cliente'].includes(s.estado));
        const historial = all.filter(s => ['finalizado', 'rechazada', 'cancelada', 'abandonada'].includes(s.estado));

        if (pendientes.length > 0) groups.push({ key: 'pendientes', label: 'Pendientes', icon: 'schedule', color: 'amber', items: pendientes });
        if (negociacion.length > 0) groups.push({ key: 'negociacion', label: 'En Negociación', icon: 'forum', color: 'cyan', items: negociacion });
        if (reservados.length > 0) groups.push({ key: 'reservados', label: 'Reservados', icon: 'event_available', color: 'green', items: reservados });
        if (activos.length > 0) groups.push({ key: 'activos', label: 'Activos', icon: 'play_circle', color: 'emerald', items: activos });
        if (historial.length > 0) groups.push({ key: 'historial', label: 'Historial', icon: 'history', color: 'slate', items: historial });

        return groups;
    });

    // Grupos filtrados según el tab activo
    gruposFiltrados = computed(() => {
        const tab = this.tabActivo();
        const all = this.solicitudesAgrupadas();
        if (tab === 'todos') return all;
        return all.filter(g => g.key === tab);
    });

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

            // Verificar si tiene perfil completo
            if (!user.profile_id) {
                console.warn('⚠️ Perfil incompleto detectado, redirigiendo a registro');
                this.router.navigate(['/proveedor/registro']);
                return;
            }

            // 2. Obtener todas las solicitudes del proveedor desde Supabase
            const solicitudes = await this.obtenerSolicitudesProveedor(user.id);

            // 3. Calcular métricas
            this.calcularMetricas(solicitudes);

            // 4. Procesar solicitudes para la tabla
            this.procesarSolicitudesTabla(solicitudes);

            // 5. Calcular próxima cita
            this.calcularProximaCita(solicitudes);

            // 6. Calcular ganancias desde solicitudes
            this.calcularGanancias(solicitudes);

            // 7. Obtener estadísticas de reseñas
            this.cargarEstadisticasResenas(user.id);

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
            return ['reservado', 'pagado', 'en_progreso', 'aceptado', 'confirmado', 'finalizado', 'entregado_pendiente_liq'].includes(estado);
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
     * Ordenar por estado (pendientes primero, luego activos, luego historial)
     * y dentro de cada grupo, los más recientes arriba
     */
    private procesarSolicitudesTabla(solicitudes: any[]) {
        const getEstadoPrioridad = (estado: string): number => {
            switch (estado) {
                case 'pendiente_aprobacion':
                case 'pendiente':
                    return 0;
                case 'en_negociacion':
                    return 1;
                case 'esperando_anticipo':
                    return 2;
                case 'reservado':
                case 'en_progreso':
                case 'entregado_pendiente_liq':
                    return 3;
                default:
                    return 4;
            }
        };

        const solicitudesFormateadas: RequestRow[] = solicitudes
            .map(req => ({
                id: req.id || '',
                evento: req.titulo_evento || 'Evento General',
                ubicacion: req.direccion_servicio || 'Ubicación no especificada',
                fechaServicio: new Date(req.fecha_servicio),
                estado: this.mapEstado(req.estado),
                monto: req.monto_total || req.monto,
                cliente_nombre: req.perfil_cliente?.nombre_completo || 'Cliente'
            }))
            .sort((a, b) => {
                const prioA = getEstadoPrioridad(a.estado);
                const prioB = getEstadoPrioridad(b.estado);
                if (prioA !== prioB) return prioA - prioB;
                return b.fechaServicio.getTime() - a.fechaServicio.getTime();
            })
            .slice(0, 10);

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

    private cargarEstadisticasResenas(providerId: string) {
        this.resenasService.getStatsProveedor(providerId).subscribe({
            next: (data) => {
                this.stats.update(stats => ({
                    ...stats,
                    ratingPromedio: data.promedio,
                    totalResenas: data.total
                }));
            },
            error: (err) => console.error('Error al cargar stats de reseñas:', err)
        });
    }

    /**
     * Calcular ganancias totales desde la tabla pagos
     * (Si la tabla pagos existe en tu BD)
     */
    private calcularGanancias(solicitudes: any[]) {
        try {
            // Calculamos las ganancias sumando los montos de solicitudes confirmadas o finalizadas
            const gananciasTotales = solicitudes
                .filter(s => {
                    const estado = s.estado?.toLowerCase();
                    // Incluimos todos los estados que representen una venta efectiva
                    return ['reservado', 'pagado', 'en_progreso', 'entregado_pendiente_liq', 'finalizado'].includes(estado);
                })
                .reduce((sum, s) => {
                    const monto = Number(s.monto_total) || Number(s.monto) || 0;
                    return sum + monto;
                }, 0);

            this.stats.update(stats => ({
                ...stats,
                gananciasTotales: gananciasTotales
            }));

            console.log('💰 Ganancias calculadas:', gananciasTotales);

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
    private mapEstado(estado: string): string {
        // Pasar el estado tal cual para que se muestre correctamente
        // Los estados válidos son: pendiente_aprobacion, esperando_anticipo, reservado,
        // en_progreso, entregado_pendiente_liq, finalizado, rechazada, cancelada
        return estado || 'pendiente';
    }

    /**
     * Obtener clases CSS para badges de estado
     */
    getEstadoClasses(estado: string): string {
        const clases: Record<string, string> = {
            'pendiente_aprobacion': 'bg-amber-50 text-amber-600 border border-amber-100',
            'en_negociacion': 'bg-cyan-50 text-cyan-600 border border-cyan-100',
            'esperando_anticipo': 'bg-orange-50 text-orange-600 border border-orange-100',
            'reservado': 'bg-green-50 text-green-600 border border-green-100',
            'en_progreso': 'bg-blue-50 text-blue-600 border border-blue-100',
            'entregado_pendiente_liq': 'bg-purple-50 text-purple-600 border border-purple-100',
            'finalizado': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            'rechazada': 'bg-red-50 text-red-600 border border-red-100',
            'cancelada': 'bg-slate-100 text-slate-600 border border-slate-200',
            'pendiente': 'bg-yellow-50 text-yellow-600 border border-yellow-100',
            'aprobado': 'bg-teal-50 text-teal-600 border border-teal-100'
        };
        return clases[estado] || clases['pendiente'];
    }

    /**
     * Obtener texto legible para estados
     */
    getEstadoTexto(estado: string): string {
        const textos: Record<string, string> = {
            'pendiente_aprobacion': 'Pendiente de Aprobación',
            'en_negociacion': 'En Negociación',
            'esperando_anticipo': 'Esperando Anticipo',
            'reservado': 'Reservado',
            'en_progreso': 'En Progreso',
            'entregado_pendiente_liq': 'Por Liquidar',
            'finalizado': '✓ Finalizado',
            'rechazada': 'Rechazada',
            'cancelada': 'Cancelada',
            'pendiente': 'Pendiente',
            'aprobado': 'Aprobado'
        };
        if (textos[estado]) return textos[estado];
        if (!estado) return 'Desconocido';
        return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

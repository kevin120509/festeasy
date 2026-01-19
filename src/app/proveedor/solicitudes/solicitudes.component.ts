import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ApiService } from '../../services/api.service';

// Interface para las solicitudes de clientes
interface ClienteSolicitud {
    id: string;
    cliente: {
        nombre: string;
        avatar: string;
        verificado: boolean;
    };
    evento: {
        tipo: string; // 'BODA', 'XV AÑOS', 'CORPORATIVO', etc.
        titulo: string;
        fecha: Date;
        ubicacion: string;
    };
    paquete: {
        nombre: string;
        presupuestoBase: number;
    };
    urgente: boolean;
    horasRestantes?: number;
}

type TabType = 'nuevas' | 'activas' | 'historial';

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [CommonModule, DatePipe, CurrencyPipe, RouterLink],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    private auth = inject(AuthService);
    private supabaseData = inject(SupabaseDataService);
    private api = inject(ApiService);

    // Tab activo
    tabActivo = signal<TabType>('nuevas');

    // Estados
    isLoading = signal(false);
    mensajeExito = signal('');
    mensajeError = signal('');

    // Solicitudes reales desde Supabase
    solicitudesReales = signal<any[]>([]);

    // Mock data para demostración (se reemplazará con datos reales)
    solicitudesMock = signal<ClienteSolicitud[]>([
        {
            id: '1',
            cliente: {
                nombre: 'María González',
                avatar: 'https://i.pravatar.cc/150?img=1',
                verificado: true
            },
            evento: {
                tipo: 'BODA',
                titulo: 'Boda Romántica en Jardín',
                fecha: new Date(2026, 3, 15, 18, 0),
                ubicacion: 'Hacienda Vista Hermosa, Cuernavaca'
            },
            paquete: {
                nombre: 'Paquete Premium Bodas',
                presupuestoBase: 25000
            },
            urgente: true,
            horasRestantes: 23
        },
        {
            id: '2',
            cliente: {
                nombre: 'Carlos Ramírez',
                avatar: 'https://i.pravatar.cc/150?img=12',
                verificado: false
            },
            evento: {
                tipo: 'XV AÑOS',
                titulo: 'Quinceañera Elegante',
                fecha: new Date(2026, 4, 20, 19, 0),
                ubicacion: 'Salón Crystal, Ciudad de México'
            },
            paquete: {
                nombre: 'Paquete Decoración XV Años',
                presupuestoBase: 18000
            },
            urgente: false
        }
    ]);

    ngOnInit(): void {
        this.cargarSolicitudes();
    }

    cargarSolicitudes() {
        const user = this.auth.currentUser();
        if (!user || !user.id) return;

        this.isLoading.set(true);
        this.supabaseData.getRequestsByProvider(user.id).subscribe({
            next: (requests) => {
                this.solicitudesReales.set(requests);
                console.log('Solicitudes cargadas:', requests);
                // Aquí puedes mapear los datos reales al formato de la interfaz
                this.isLoading.set(false);
            },
            error: (err: any) => {
                console.error('Error al cargar solicitudes:', err);
                this.isLoading.set(false);
            }
        });
    }

    // Cambiar tab
    cambiarTab(tab: TabType) {
        this.tabActivo.set(tab);
    }

    // Obtener solicitudes filtradas por tab
    get solicitudesFiltradas(): ClienteSolicitud[] {
        const tab = this.tabActivo();
        if (tab === 'nuevas') {
            return this.solicitudesMock();
        } else if (tab === 'activas') {
            return []; // Implementar filtro para activas
        } else {
            return []; // Implementar filtro para historial
        }
    }

    // Contar solicitudes nuevas
    get conteoNuevas(): number {
        return this.solicitudesMock().length;
    }

    // Obtener clases CSS para badge de tipo de evento
    getTipoEventoClasses(tipo: string): string {
        const clases: Record<string, string> = {
            'BODA': 'bg-purple-100 text-purple-700',
            'XV AÑOS': 'bg-pink-100 text-pink-700',
            'CORPORATIVO': 'bg-blue-100 text-blue-700',
            'CUMPLEAÑOS': 'bg-yellow-100 text-yellow-700'
        };
        return clases[tipo] || 'bg-gray-100 text-gray-700';
    }

    // Responder a una solicitud (abrir modal de cotización)
    responderSolicitud(id: string) {
        console.log('Respondiendo a solicitud:', id);
        // TODO: Abrir modal de cotización o navegar a formulario
        const precioInput = window.prompt('Ingresa el precio total propuesto para este servicio:', '');

        if (precioInput === null) return;

        const precio = parseFloat(precioInput);

        if (isNaN(precio) || precio <= 0) {
            this.mensajeError.set('Por favor ingresa un precio válido');
            setTimeout(() => this.mensajeError.set(''), 3000);
            return;
        }

        const currentUser = this.auth.currentUser();
        if (!currentUser || !currentUser.id) {
            this.mensajeError.set('Error: No se pudo identificar el usuario');
            setTimeout(() => this.mensajeError.set(''), 3000);
            return;
        }

        const quoteData = {
            solicitud_id: id,
            proveedor_usuario_id: currentUser.id,
            precio_total_propuesto: precio,
            estado: 'pendiente'
        };

        this.api.createQuote(quoteData).subscribe({
            next: (quote: any) => {
                this.mensajeExito.set('Cotización enviada exitosamente');
                setTimeout(() => this.mensajeExito.set(''), 3000);
                this.cargarSolicitudes();
            },
            error: (err: any) => {
                console.error('Error al crear cotización:', err);
                this.mensajeError.set('Error al crear la cotización');
                setTimeout(() => this.mensajeError.set(''), 3000);
            }
        });
    }

    // Rechazar una solicitud
    rechazarSolicitud(id: string) {
        if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud?')) return;

        this.supabaseData.updateRequestStatus(id, 'rechazada').then(
            () => {
                this.mensajeExito.set('Solicitud rechazada');
                setTimeout(() => this.mensajeExito.set(''), 3000);
                this.cargarSolicitudes();
            },
            (err) => {
                console.error('Error al rechazar solicitud:', err);
                this.mensajeError.set('Error al rechazar la solicitud');
                setTimeout(() => this.mensajeError.set(''), 3000);
            }
        );
    }
}

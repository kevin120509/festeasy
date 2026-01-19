import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';

interface ProveedorPendiente {
    id: string;
    usuario_id: string;
    nombre_negocio: string;
    categoria: string;
    descripcion: string;
    ubicacion: string;
    email: string;
    telefono?: string;
    fecha_solicitud: Date;
    documentos?: string[];
}

@Component({
    selector: 'app-provider-approval',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './provider-approval.component.html',
    styleUrl: './provider-approval.component.css'
})
export class ProviderApprovalComponent implements OnInit {
    private supabaseData = inject(SupabaseDataService);

    proveedoresPendientes = signal<ProveedorPendiente[]>([]);
    isLoading = signal(true);
    
    // Modal de detalles
    proveedorSeleccionado = signal<ProveedorPendiente | null>(null);
    mostrarModal = signal(false);
    
    // Mensajes
    mensajeExito = signal('');
    mensajeError = signal('');

    ngOnInit(): void {
        this.cargarProveedoresPendientes();
    }

    async cargarProveedoresPendientes() {
        this.isLoading.set(true);
        try {
            // TODO: Implementar llamada real a Supabase
            setTimeout(() => {
                const mockProveedores: ProveedorPendiente[] = [
                    {
                        id: '1',
                        usuario_id: 'u1',
                        nombre_negocio: 'DJ Fiesta Total',
                        categoria: 'DJ / Sonido',
                        descripcion: 'Servicio profesional de DJ con más de 10 años de experiencia en todo tipo de eventos.',
                        ubicacion: 'Ciudad de México',
                        email: 'djfiestatotal@email.com',
                        telefono: '55 1234 5678',
                        fecha_solicitud: new Date('2026-01-18')
                    },
                    {
                        id: '2',
                        usuario_id: 'u2',
                        nombre_negocio: 'Catering Exquisito',
                        categoria: 'Catering',
                        descripcion: 'Servicio de banquetes para eventos de 50 a 500 personas. Menús personalizados.',
                        ubicacion: 'Guadalajara',
                        email: 'catering.exquisito@email.com',
                        telefono: '33 9876 5432',
                        fecha_solicitud: new Date('2026-01-17')
                    },
                    {
                        id: '3',
                        usuario_id: 'u3',
                        nombre_negocio: 'Foto & Video Pro',
                        categoria: 'Fotografía',
                        descripcion: 'Fotografía y video profesional para bodas, XV años y eventos corporativos.',
                        ubicacion: 'Monterrey',
                        email: 'fotovideopro@email.com',
                        fecha_solicitud: new Date('2026-01-15')
                    },
                    {
                        id: '4',
                        usuario_id: 'u4',
                        nombre_negocio: 'Decoraciones Mágicas',
                        categoria: 'Decoración',
                        descripcion: 'Decoración temática para todo tipo de eventos. Globos, flores, centros de mesa.',
                        ubicacion: 'Puebla',
                        email: 'decormagicas@email.com',
                        fecha_solicitud: new Date('2026-01-14')
                    },
                    {
                        id: '5',
                        usuario_id: 'u5',
                        nombre_negocio: 'Salón Crystal Palace',
                        categoria: 'Salones',
                        descripcion: 'Salón de eventos con capacidad para 300 personas. Incluye mobiliario y estacionamiento.',
                        ubicacion: 'Querétaro',
                        email: 'crystalpalace@email.com',
                        fecha_solicitud: new Date('2026-01-12')
                    }
                ];
                this.proveedoresPendientes.set(mockProveedores);
                this.isLoading.set(false);
            }, 500);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            this.isLoading.set(false);
        }
    }

    abrirDetalles(proveedor: ProveedorPendiente) {
        this.proveedorSeleccionado.set(proveedor);
        this.mostrarModal.set(true);
    }

    cerrarModal() {
        this.mostrarModal.set(false);
        this.proveedorSeleccionado.set(null);
    }

    async aprobarProveedor(proveedor: ProveedorPendiente) {
        try {
            // TODO: Implementar llamada a Supabase para aprobar
            console.log('Aprobando proveedor:', proveedor.nombre_negocio);
            
            // Actualizar lista localmente
            const actualizado = this.proveedoresPendientes().filter(p => p.id !== proveedor.id);
            this.proveedoresPendientes.set(actualizado);
            
            this.mostrarMensajeExito(`${proveedor.nombre_negocio} ha sido aprobado`);
            this.cerrarModal();
        } catch (error) {
            console.error('Error aprobando proveedor:', error);
            this.mostrarMensajeError('Error al aprobar el proveedor');
        }
    }

    async rechazarProveedor(proveedor: ProveedorPendiente) {
        const motivo = window.prompt('Motivo del rechazo (opcional):');
        
        try {
            // TODO: Implementar llamada a Supabase para rechazar
            console.log('Rechazando proveedor:', proveedor.nombre_negocio, 'Motivo:', motivo);
            
            // Actualizar lista localmente
            const actualizado = this.proveedoresPendientes().filter(p => p.id !== proveedor.id);
            this.proveedoresPendientes.set(actualizado);
            
            this.mostrarMensajeExito(`${proveedor.nombre_negocio} ha sido rechazado`);
            this.cerrarModal();
        } catch (error) {
            console.error('Error rechazando proveedor:', error);
            this.mostrarMensajeError('Error al rechazar el proveedor');
        }
    }

    mostrarMensajeExito(mensaje: string) {
        this.mensajeExito.set(mensaje);
        setTimeout(() => this.mensajeExito.set(''), 3000);
    }

    mostrarMensajeError(mensaje: string) {
        this.mensajeError.set(mensaje);
        setTimeout(() => this.mensajeError.set(''), 3000);
    }

    getCategoriaClasses(categoria: string): string {
        const classes: Record<string, string> = {
            'DJ / Sonido': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'Catering': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'Fotografía': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Decoración': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            'Salones': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'Iluminación': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'Pastelería': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        };
        return classes[categoria] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
}

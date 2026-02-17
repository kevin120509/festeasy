import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';

interface Usuario {
    id: string;
    correo_electronico: string;
    rol: 'client' | 'provider' | 'admin';
    nombre: string;
    fecha_registro: Date;
    estado: 'activo' | 'bloqueado' | 'pendiente';
    avatar?: string;
    // Campos adicionales para vista detallada
    telefono?: string;
    direccion?: string;
    descripcion?: string;
    nombre_negocio?: string;
    tipo_suscripcion?: string;
}

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './user-management.component.html',
    styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
    private supabaseData = inject(SupabaseDataService);

    usuarios = signal<Usuario[]>([]);
    usuariosFiltrados = signal<Usuario[]>([]);
    isLoading = signal(true);

    // Filtros
    busqueda = '';
    filtroRol: string = 'todos';
    filtroEstado: string = 'todos';

    // Paginación
    paginaActual = signal(1);
    usuariosPorPagina = 10;

    // Modal
    usuarioSeleccionado = signal<Usuario | null>(null);
    mostrarModal = signal(false);

    // Paquetes del proveedor seleccionado
    paquetesProveedor = signal<any[]>([]);
    isLoadingPaquetes = signal(false);

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    async cargarUsuarios() {
        this.isLoading.set(true);
        try {
            const [proveedores, clientes] = await Promise.all([
                this.supabaseData.getAllProvidersDetailed(),
                this.supabaseData.getAllClientsDetailed()
            ]);

            const usuariosProveedores: Usuario[] = proveedores.map(p => ({
                id: p.usuario_id,
                correo_electronico: p.correo_electronico || '',
                rol: 'provider',
                nombre: p.nombre_negocio,
                fecha_registro: new Date(p.creado_en),
                estado: p.estado === 'blocked' ? 'bloqueado' : 'activo',
                avatar: p.avatar_url,
                telefono: p.telefono,
                direccion: p.direccion_formato,
                descripcion: p.descripcion,
                nombre_negocio: p.nombre_negocio,
                tipo_suscripcion: p.tipo_suscripcion_actual
            }));

            const usuariosClientes: Usuario[] = clientes.map(c => ({
                id: c.usuario_id,
                correo_electronico: '', // Perfil cliente no suele tener el core de auth aquí
                rol: 'client',
                nombre: c.nombre_completo,
                fecha_registro: new Date(c.creado_en),
                estado: c.estado === 'blocked' ? 'bloqueado' : 'activo',
                avatar: c.avatar_url,
                telefono: c.telefono
            }));

            this.usuarios.set([...usuariosProveedores, ...usuariosClientes]);
            this.aplicarFiltros();
            this.isLoading.set(false);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            this.isLoading.set(false);
        }
    }

    aplicarFiltros() {
        let filtrados = [...this.usuarios()];

        // Filtro por búsqueda
        if (this.busqueda.trim()) {
            const busquedaLower = this.busqueda.toLowerCase();
            filtrados = filtrados.filter(u =>
                u.nombre.toLowerCase().includes(busquedaLower) ||
                u.correo_electronico.toLowerCase().includes(busquedaLower)
            );
        }

        // Filtro por rol
        if (this.filtroRol !== 'todos') {
            filtrados = filtrados.filter(u => u.rol === this.filtroRol);
        }

        // Filtro por estado
        if (this.filtroEstado !== 'todos') {
            filtrados = filtrados.filter(u => u.estado === this.filtroEstado);
        }

        this.usuariosFiltrados.set(filtrados);
        this.paginaActual.set(1);
    }

    get usuariosPaginados(): Usuario[] {
        const inicio = (this.paginaActual() - 1) * this.usuariosPorPagina;
        return this.usuariosFiltrados().slice(inicio, inicio + this.usuariosPorPagina);
    }

    get totalPaginas(): number {
        return Math.ceil(this.usuariosFiltrados().length / this.usuariosPorPagina);
    }

    cambiarPagina(pagina: number) {
        if (pagina >= 1 && pagina <= this.totalPaginas) {
            this.paginaActual.set(pagina);
        }
    }

    async abrirModalUsuario(usuario: Usuario) {
        this.usuarioSeleccionado.set(usuario);
        this.mostrarModal.set(true);
        this.paquetesProveedor.set([]);

        if (usuario.rol === 'provider') {
            this.isLoadingPaquetes.set(true);
            try {
                this.supabaseData.getProviderPackages(usuario.id).subscribe({
                    next: (paquetes) => {
                        this.paquetesProveedor.set(paquetes);
                        this.isLoadingPaquetes.set(false);
                    },
                    error: (err) => {
                        console.error('Error cargando paquetes:', err);
                        this.isLoadingPaquetes.set(false);
                    }
                });
            } catch (error) {
                console.error('Error fetch paquetes:', error);
                this.isLoadingPaquetes.set(false);
            }
        }
    }

    cerrarModal() {
        this.mostrarModal.set(false);
        this.usuarioSeleccionado.set(null);
        this.paquetesProveedor.set([]);
    }

    async cambiarEstadoUsuario(usuario: Usuario, nuevoEstado: 'activo' | 'bloqueado') {
        try {
            const statusToDb = nuevoEstado === 'bloqueado' ? 'blocked' : 'active';
            await this.supabaseData.updateUserStatus(usuario.id, usuario.rol as any, statusToDb);

            // Actualizar localmente
            const usuarios = this.usuarios().map(u =>
                u.id === usuario.id ? { ...u, estado: nuevoEstado } : u
            );
            this.usuarios.set(usuarios);
            this.aplicarFiltros();
            this.cerrarModal();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('No se pudo actualizar el estado del usuario');
        }
    }

    /**
     * Permite al admin modificar el precio de un paquete desde la gestión de usuarios
     * (Asumiendo que seleccionamos un proveedor y vemos sus paquetes)
     */
    async modificarPrecioPaquete(paqueteId: string, nuevoPrecio: number) {
        try {
            await this.supabaseData.updatePackagePrice(paqueteId, nuevoPrecio);
            alert('Precio actualizado correctamente');
            // Podríamos recargar si estuviéramos viendo una lista de paquetes del usuario
        } catch (error) {
            console.error('Error al actualizar precio:', error);
            alert('Error al actualizar el precio del paquete');
        }
    }

    async cambiarRolUsuario(usuario: Usuario, nuevoRol: 'client' | 'provider' | 'admin') {
        // Esta funcionalidad requiere más cuidado ya que implica mover perfiles entre tablas
        console.warn('Cambio de rol no implementado por seguridad de integridad referencial');
        alert('El cambio de rol requiere intervención técnica directa');
    }

    getRolLabel(rol: string): string {
        const labels: Record<string, string> = {
            'client': 'Cliente',
            'provider': 'Proveedor',
            'admin': 'Administrador'
        };
        return labels[rol] || rol;
    }

    getRolClasses(rol: string): string {
        const classes: Record<string, string> = {
            'client': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'provider': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return classes[rol] || 'bg-gray-100 text-gray-700';
    }

    getEstadoClasses(estado: string): string {
        const classes: Record<string, string> = {
            'activo': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'bloqueado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'pendiente': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        };
        return classes[estado] || 'bg-gray-100 text-gray-700';
    }
}

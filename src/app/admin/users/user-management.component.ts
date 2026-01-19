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

    ngOnInit(): void {
        this.cargarUsuarios();
    }

    async cargarUsuarios() {
        this.isLoading.set(true);
        try {
            // TODO: Implementar llamada real a Supabase
            // Por ahora usamos datos de ejemplo
            setTimeout(() => {
                const mockUsuarios: Usuario[] = [
                    { id: '1', correo_electronico: 'maria@email.com', rol: 'client', nombre: 'María González', fecha_registro: new Date('2025-12-01'), estado: 'activo' },
                    { id: '2', correo_electronico: 'carlos@email.com', rol: 'provider', nombre: 'Carlos Ramírez - DJ Fiesta', fecha_registro: new Date('2025-11-15'), estado: 'activo' },
                    { id: '3', correo_electronico: 'ana@email.com', rol: 'client', nombre: 'Ana López', fecha_registro: new Date('2026-01-10'), estado: 'activo' },
                    { id: '4', correo_electronico: 'pedro@email.com', rol: 'provider', nombre: 'Pedro Sánchez - Catering Deluxe', fecha_registro: new Date('2026-01-05'), estado: 'pendiente' },
                    { id: '5', correo_electronico: 'lucia@email.com', rol: 'client', nombre: 'Lucía Martínez', fecha_registro: new Date('2025-10-20'), estado: 'bloqueado' },
                    { id: '6', correo_electronico: 'admin@festeasy.com', rol: 'admin', nombre: 'Administrador', fecha_registro: new Date('2025-01-01'), estado: 'activo' },
                ];
                this.usuarios.set(mockUsuarios);
                this.aplicarFiltros();
                this.isLoading.set(false);
            }, 500);
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

    abrirModalUsuario(usuario: Usuario) {
        this.usuarioSeleccionado.set(usuario);
        this.mostrarModal.set(true);
    }

    cerrarModal() {
        this.mostrarModal.set(false);
        this.usuarioSeleccionado.set(null);
    }

    async cambiarEstadoUsuario(usuario: Usuario, nuevoEstado: 'activo' | 'bloqueado') {
        // TODO: Implementar llamada a Supabase para actualizar estado
        console.log(`Cambiando estado de ${usuario.nombre} a ${nuevoEstado}`);
        
        // Actualizar localmente
        const usuarios = this.usuarios().map(u => 
            u.id === usuario.id ? { ...u, estado: nuevoEstado } : u
        );
        this.usuarios.set(usuarios);
        this.aplicarFiltros();
        this.cerrarModal();
    }

    async cambiarRolUsuario(usuario: Usuario, nuevoRol: 'client' | 'provider' | 'admin') {
        // TODO: Implementar llamada a Supabase para actualizar rol
        console.log(`Cambiando rol de ${usuario.nombre} a ${nuevoRol}`);
        
        const usuarios = this.usuarios().map(u => 
            u.id === usuario.id ? { ...u, rol: nuevoRol } : u
        );
        this.usuarios.set(usuarios);
        this.aplicarFiltros();
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

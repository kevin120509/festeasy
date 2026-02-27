import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Producto } from '../../models';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProductoFormComponent } from './form/producto-form.component';

@Component({
    selector: 'app-inventario',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        RippleModule,
        ToastModule,
        TooltipModule,
        ProductoFormComponent
    ],
    providers: [MessageService],
    templateUrl: './inventario.component.html',
    styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private messageService = inject(MessageService);

    productos = signal<Producto[]>([]);
    isLoading = signal(true);
    filtroActual = signal<'todos' | 'bajo' | 'agotado'>('todos');

    // Dialog control
    mostrarDialogo = signal(false);
    productoSeleccionado = signal<Producto | null>(null);

    ngOnInit() {
        this.cargarInventario();
    }

    cargarInventario() {
        this.isLoading.set(true);
        this.inventoryService.getProductos().subscribe({
            next: (data) => {
                this.productos.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error al cargar inventario:', err);
                this.isLoading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el inventario' });
            }
        });
    }

    getProductosFiltrados() {
        const todos = this.productos();
        const filtro = this.filtroActual();

        if (filtro === 'bajo') {
            return todos.filter(p => p.stock > 0 && p.stock < 5);
        } else if (filtro === 'agotado') {
            return todos.filter(p => p.stock === 0);
        }
        return todos;
    }

    setFiltro(filtro: 'todos' | 'bajo' | 'agotado') {
        this.filtroActual.set(filtro);
    }

    getEstadoStock(stock: number) {
        if (stock === 0) return { label: 'SIN STOCK', class: 'bg-red-50 text-red-600 border-red-100' };
        if (stock < 5) return { label: 'STOCK BAJO', class: 'bg-orange-50 text-orange-600 border-orange-100' };
        return { label: 'STOCK ALTO', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    }

    toggleDestacado(producto: Producto) {
        this.inventoryService.updateProducto(producto.id, { destacado: !producto.destacado }).subscribe({
            next: (updated) => {
                if (updated) {
                    this.productos.update(prev => prev.map(p => p.id === updated.id ? updated : p));
                    this.messageService.add({
                        severity: 'success',
                        summary: updated.destacado ? 'Destacado' : 'No destacado',
                        detail: 'Producto actualizado'
                    });
                }
            }
        });
    }

    eliminarProducto(id: string) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            this.inventoryService.deleteProducto(id).subscribe({
                next: (success) => {
                    if (success) {
                        this.productos.update(prev => prev.filter(p => p.id !== id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado correctamente' });
                    }
                }
            });
        }
    }

    abrirDialogo(p: Producto | null = null) {
        this.productoSeleccionado.set(p);
        this.mostrarDialogo.set(true);
    }

    cerrarDialogo() {
        this.mostrarDialogo.set(false);
        this.productoSeleccionado.set(null);
    }

    onProductoGuardado(p: Producto) {
        const actual = this.productos();
        const index = actual.findIndex(prod => prod.id === p.id);

        if (index >= 0) {
            this.productos.update(prev => prev.map(prod => prod.id === p.id ? p : prod));
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Producto actualizado con éxito' });
        } else {
            this.productos.update(prev => [p, ...prev]);
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Producto creado con éxito' });
        }
        this.cerrarDialogo();
    }
}

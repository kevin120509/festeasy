import { Component, Input, Output, EventEmitter, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotizacionService } from '../../../services/cotizacion.service';
import {
    CotizacionBorrador,
    DesglosePaqueteBase,
    DesgloseProducto,
    DesgloseAjuste,
    Producto,
    ServiceRequest,
    RequestItem
} from '../../../models';

@Component({
    selector: 'app-cotizador',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cotizador.component.html',
    styleUrl: './cotizador.component.css'
})
export class CotizadorComponent implements OnInit {
    private cotizacionService = inject(CotizacionService);

    @Input() solicitud!: ServiceRequest;
    @Input() proveedorId!: string;
    @Input() porcentajeAnticipo: number = 30;

    @Output() cotizacionEnviada = new EventEmitter<void>();
    @Output() borradorGuardado = new EventEmitter<void>();

    // State
    loading = signal(false);
    saving = signal(false);
    sending = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

    // Borrador
    paqueteBase = signal<DesglosePaqueteBase>({
        paquete_id: '',
        nombre: '',
        precio_base: 0,
        cantidad: 1
    });
    productosExtra = signal<DesgloseProducto[]>([]);
    ajustes = signal<DesgloseAjuste[]>([]);
    anticipoTipo = signal<'porcentaje' | 'monto_fijo'>('porcentaje');
    anticipoValor = signal(30);
    notasProveedor = signal('');
    acuerdoChatConfirmado = signal(false);

    // Inventory search
    inventarioProductos = signal<Producto[]>([]);
    busquedaInventario = signal('');
    loadingInventario = signal(false);

    // Nuevo ajuste
    nuevoAjusteConcepto = signal('');
    nuevoAjusteTipo = signal<'cargo' | 'descuento'>('cargo');
    nuevoAjusteMonto = signal(0);

    // Computed totals
    totales = computed(() => {
        return this.cotizacionService.calcularTotales(
            this.paqueteBase(),
            this.productosExtra(),
            this.ajustes(),
            this.anticipoTipo(),
            this.anticipoValor()
        );
    });

    // Validation
    canSend = computed(() => {
        return this.acuerdoChatConfirmado()
            && this.paqueteBase().nombre !== ''
            && this.totales().monto_total > 0
            && !this.sending();
    });

    async ngOnInit() {
        // Initialize from existing borrador or from solicitud items
        this.loading.set(true);
        try {
            const existing = await this.cotizacionService.getBorrador(this.solicitud.id);
            if (existing) {
                this.loadBorrador(existing);
            } else {
                this.initFromSolicitud();
            }

            // Set anticipo from provider profile
            this.anticipoValor.set(this.porcentajeAnticipo);

            // Load inventory
            await this.cargarInventario();
        } catch (err: any) {
            this.errorMessage.set('Error cargando datos: ' + err.message);
        } finally {
            this.loading.set(false);
        }
    }

    private loadBorrador(borrador: CotizacionBorrador) {
        this.paqueteBase.set(borrador.paquete_base);
        this.productosExtra.set(borrador.productos_extra);
        this.ajustes.set(borrador.ajustes_proveedor);
        this.anticipoTipo.set(borrador.anticipo_tipo);
        this.anticipoValor.set(borrador.anticipo_valor);
        this.notasProveedor.set(borrador.notas_proveedor || '');
    }

    private initFromSolicitud() {
        if (this.solicitud.items && this.solicitud.items.length > 0) {
            const firstItem = this.solicitud.items[0];
            this.paqueteBase.set({
                paquete_id: firstItem.paquete_id || '',
                nombre: firstItem.nombre_paquete_snapshot,
                precio_base: firstItem.precio_unitario,
                cantidad: firstItem.cantidad
            });
        }
    }

    // ========================================
    // Inventory
    // ========================================
    async cargarInventario() {
        this.loadingInventario.set(true);
        try {
            const productos = await this.cotizacionService.getProductosProveedor(this.proveedorId);
            this.inventarioProductos.set(productos);
        } catch (err) {
            console.error('Error cargando inventario:', err);
        } finally {
            this.loadingInventario.set(false);
        }
    }

    async buscarEnInventario() {
        const query = this.busquedaInventario().trim();
        if (!query) {
            await this.cargarInventario();
            return;
        }
        this.loadingInventario.set(true);
        try {
            const productos = await this.cotizacionService.buscarProductos(this.proveedorId, query);
            this.inventarioProductos.set(productos);
        } catch (err) {
            console.error('Error buscando productos:', err);
        } finally {
            this.loadingInventario.set(false);
        }
    }

    agregarProductoDesdeInventario(producto: Producto) {
        // Check if already added
        const existing = this.productosExtra().find(p => p.producto_id === producto.id);
        if (existing) return;

        const nuevoProducto: DesgloseProducto = {
            producto_id: producto.id,
            nombre: producto.nombre,
            precio_unitario: producto.precio_unitario,
            cantidad: 1,
            subtotal: producto.precio_unitario
        };
        this.productosExtra.update(p => [...p, nuevoProducto]);
    }

    // ========================================
    // Productos extra management
    // ========================================
    updateProductoCantidad(index: number, cantidad: number) {
        this.productosExtra.update(productos => {
            const updated = [...productos];
            const p = { ...updated[index] };
            p.cantidad = cantidad;
            p.subtotal = p.precio_unitario * cantidad;
            updated[index] = p;
            return updated;
        });
    }

    updateProductoPrecio(index: number, precio: number) {
        this.productosExtra.update(productos => {
            const updated = [...productos];
            const p = { ...updated[index] };
            p.precio_unitario = precio;
            p.subtotal = precio * p.cantidad;
            updated[index] = p;
            return updated;
        });
    }

    removeProducto(index: number) {
        this.productosExtra.update(p => p.filter((_, i) => i !== index));
    }

    // ========================================
    // Ajustes (cargos / descuentos)
    // ========================================
    addAjuste() {
        const concepto = this.nuevoAjusteConcepto().trim();
        const monto = this.nuevoAjusteMonto();
        if (!concepto || monto <= 0) return;

        const ajuste: DesgloseAjuste = {
            concepto,
            tipo: this.nuevoAjusteTipo(),
            monto
        };
        this.ajustes.update(a => [...a, ajuste]);
        this.nuevoAjusteConcepto.set('');
        this.nuevoAjusteMonto.set(0);
    }

    removeAjuste(index: number) {
        this.ajustes.update(a => a.filter((_, i) => i !== index));
    }

    // ========================================
    // Paquete base update
    // ========================================
    updatePaquetePrecio(precio: number) {
        this.paqueteBase.update(p => ({ ...p, precio_base: precio }));
    }

    updatePaqueteCantidad(cantidad: number) {
        this.paqueteBase.update(p => ({ ...p, cantidad }));
    }

    // ========================================
    // Serialize / Save / Send
    // ========================================
    private buildBorrador(): CotizacionBorrador {
        const t = this.totales();
        return {
            paquete_base: this.paqueteBase(),
            productos_extra: this.productosExtra(),
            ajustes_proveedor: this.ajustes(),
            subtotal: t.subtotal,
            descuento_total: t.descuento_total,
            monto_total: t.monto_total,
            anticipo_tipo: this.anticipoTipo(),
            anticipo_valor: this.anticipoValor(),
            monto_anticipo: t.monto_anticipo,
            monto_liquidacion: t.monto_liquidacion,
            notas_proveedor: this.notasProveedor() || undefined
        };
    }

    async guardarBorrador() {
        if (this.saving()) return;
        this.saving.set(true);
        this.errorMessage.set('');
        try {
            await this.cotizacionService.guardarBorrador(this.solicitud.id, this.buildBorrador());
            this.successMessage.set('Borrador guardado ✓');
            setTimeout(() => this.successMessage.set(''), 3000);
            this.borradorGuardado.emit();
        } catch (err: any) {
            this.errorMessage.set('Error guardando borrador: ' + err.message);
        } finally {
            this.saving.set(false);
        }
    }

    async enviarCotizacion() {
        if (!this.canSend()) return;
        this.sending.set(true);
        this.errorMessage.set('');
        try {
            await this.cotizacionService.enviarCotizacion(this.solicitud.id, this.buildBorrador());
            this.successMessage.set('¡Cotización enviada al cliente! 🎉');
            this.cotizacionEnviada.emit();
        } catch (err: any) {
            this.errorMessage.set('Error enviando cotización: ' + err.message);
        } finally {
            this.sending.set(false);
        }
    }

    isProductoInCotizacion(productoId: string): boolean {
        return this.productosExtra().some(p => p.producto_id === productoId);
    }
}

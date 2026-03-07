import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestItem } from '../../../models';
import { ApiService } from '../../../services/api.service';
import { InventoryService } from '../../../services/inventory.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-panel-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, ToastModule],
  providers: [MessageService],
  templateUrl: './panel-cotizacion.component.html'
})
export class PanelCotizacionComponent implements OnInit, OnChanges {
  @Input() itemsOriginales: RequestItem[] = [];
  @Input() porcentajeAnticipo: number = 30;
  @Input() solicitudId!: string;
  @Input() estadoSolicitud!: string;
  // Puede ser 'vista' (solo lee la propuesta) o 'edicion' (proveedor modificando)
  @Input() modo: 'vista' | 'edicion' = 'vista';
  @Input() esProveedor: boolean = true;
  
  @Output() enviarPropuesta = new EventEmitter<{ items: any[], total: number, anticipo: number, liquidacion: number }>();
  @Output() aceptarPropuesta = new EventEmitter<void>();

  private api = inject(ApiService);
  private inventoryService = inject(InventoryService);
  private messageService = inject(MessageService);

  itemsEditables = signal<any[]>([]);
  procesando = signal(false);
  acuerdoConfirmado = signal(false);

  // Inventario interactivo
  inventarioOriginal = signal<any[]>([]);
  inventarioFiltrado = signal<any[]>([]);
  busquedaInventario = signal('');
  nuevoProductoRapido = signal({ nombre: '', precio: 0 });

  // Totales computados
  totalCotizacion = computed(() => {
    return this.itemsEditables().reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  });

  montoAnticipo = computed(() => {
    return this.totalCotizacion() * (this.porcentajeAnticipo / 100);
  });

  montoLiquidacion = computed(() => {
    return this.totalCotizacion() - this.montoAnticipo();
  });

  ngOnInit() {
    this.cargarItemsEditables();
    if (this.modo === 'edicion' && this.esProveedor) {
      this.cargarInventario();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['itemsOriginales'] || changes['modo']) {
      this.cargarItemsEditables();
    }
  }

  cargarItemsEditables() {
    // Crear una copia profunda para edición
    const copiaItems = this.itemsOriginales.map(item => ({
      ...item,
      // Si el precio viene como NaN o string por algún bug, limpiarlo
      precio_unitario: Number(item.precio_unitario) || 0
    }));
    
    // Si no hay ítems pero está en modo edición, poner uno vacío
    if (copiaItems.length === 0 && this.modo === 'edicion') {
      copiaItems.push({
        id: '',
        solicitud_id: this.solicitudId,
        nombre_paquete_snapshot: 'Paquete Personalizado',
        cantidad: 1,
        precio_unitario: 0
      } as any);
    }

    this.itemsEditables.set(copiaItems);
  }

  // --- Lógica de Inventario interactivo ---
  async cargarInventario() {
    try {
      const productos = await this.inventoryService.getProductos().toPromise() || [];
      this.inventarioOriginal.set(productos);
      this.inventarioFiltrado.set(productos);
    } catch (err) {
      console.error('Error cargando inventario para cotización', err);
    }
  }

  buscarInventario(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.busquedaInventario.set(term);
    
    if (!term) {
      this.inventarioFiltrado.set(this.inventarioOriginal());
    } else {
      const filtrados = this.inventarioOriginal().filter(p => p.nombre.toLowerCase().includes(term));
      this.inventarioFiltrado.set(filtrados);
    }
  }

  agregarDesdeInventario(producto: any) {
    const actuales = this.itemsEditables();
    // Validar si ya existe en borrador para solo subir cantidad
    const existenteIndex = actuales.findIndex(item => item.paquete_id === producto.id || item.nombre_paquete_snapshot === producto.nombre);
    
    if (existenteIndex !== -1) {
      const nuevos = [...actuales];
      nuevos[existenteIndex].cantidad += 1;
      this.itemsEditables.set(nuevos);
    } else {
      this.itemsEditables.set([...actuales, {
        id: '',
        solicitud_id: this.solicitudId,
        paquete_id: producto.id,
        nombre_paquete_snapshot: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio_unitario || 0,
        es_nuevo: false
      }]);
    }
    this.messageService.add({ severity: 'success', summary: 'Agregado', detail: `${producto.nombre} añadido a la cotización.` });
  }

  async crearProductoRapido() {
    const nuevo = this.nuevoProductoRapido();
    if (!nuevo.nombre.trim() || nuevo.precio < 0) {
      this.messageService.add({ severity: 'warn', summary: 'Campos Inválidos', detail: 'Ingresa un nombre válido y un precio mayor a 0.' });
      return;
    }

    try {
      this.procesando.set(true);
      const newProductInfo = {
        nombre: nuevo.nombre,
        precio_unitario: nuevo.precio,
        stock: 999, // stock ilimitado por defecto para rápidos
        destacado: false,
        categoria: 'Extras'
      };

      const creado = await this.inventoryService.createProducto(newProductInfo).toPromise();
      if (creado) {
        // Actualizar lista local de inventario
        this.inventarioOriginal.update(inv => [creado, ...inv]);
        // Restablecer búsqueda visualmente  
        this.buscarInventario({ target: { value: this.busquedaInventario() } } as unknown as Event);
        
        // Agregar automáticamente a la cotización
        this.agregarDesdeInventario(creado);
        
        // Limpiar form
        this.nuevoProductoRapido.set({ nombre: '', precio: 0 });
      }
    } catch (err) {
      console.error('Error insertando a inventario:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el producto.' });
    } finally {
      this.procesando.set(false);
    }
  }
  // ----------------------------------------

  agregarItem() {
    if (this.modo !== 'edicion') return;
    
    const actuales = this.itemsEditables();
    this.itemsEditables.set([...actuales, {
      nombre_paquete_snapshot: 'Nuevo Elemento Extra',
      cantidad: 1,
      precio_unitario: 0,
      es_nuevo: true // Flag temporal para la UI
    }]);
  }

  eliminarItem(index: number) {
    if (this.modo !== 'edicion') return;
    
    const actuales = this.itemsEditables();
    if (actuales.length > 1) {
      actuales.splice(index, 1);
      this.itemsEditables.set([...actuales]);
    }
  }

  onCantidadChange(index: number, evento: Event) {
    const input = evento.target as HTMLInputElement;
    const valor = parseInt(input.value) || 1;
    this.actualizarItem(index, 'cantidad', valor < 1 ? 1 : valor);
  }

  onPrecioChange(index: number, evento: Event) {
    const input = evento.target as HTMLInputElement;
    const valor = parseFloat(input.value) || 0;
    this.actualizarItem(index, 'precio_unitario', valor < 0 ? 0 : valor);
  }

  onNombreChange(index: number, evento: Event) {
    const input = evento.target as HTMLInputElement;
    this.actualizarItem(index, 'nombre_paquete_snapshot', input.value);
  }

  async guardarEnInventario(item: any, index: number) {
    if (!item.nombre_paquete_snapshot || item.nombre_paquete_snapshot.trim() === 'Nuevo Elemento Extra') {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor asigna un nombre válido al producto antes de guardarlo.' });
      return;
    }

    try {
      this.procesando.set(true);
      const newProduct = {
        nombre: item.nombre_paquete_snapshot,
        precio_unitario: item.precio_unitario,
        stock: 999, // default infinite for custom services
        destacado: false,
        categoria: 'Extras (Personalizado)'
      };

      const creado = await this.inventoryService.createProducto(newProduct).toPromise();
      if (creado) {
        this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Ítem agregado al inventario exitosamente.' });
        // Link it to the inventory visually to avoid resaving
        this.actualizarItem(index, 'es_nuevo', false);
        this.actualizarItem(index, 'paquete_id', creado.id);
      } else {
        throw new Error('No se pudo crear el producto');
      }
    } catch (err) {
      console.error('Error insertando a inventario:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar el ítem en tu inventario.' });
    } finally {
      this.procesando.set(false);
    }
  }

  private actualizarItem(index: number, campo: string, valor: any) {
    if (this.modo !== 'edicion') return;
    
    const actuales = [...this.itemsEditables()];
    actuales[index] = { ...actuales[index], [campo]: valor };
    this.itemsEditables.set(actuales);
  }

  async guardarYEnviar() {
    if (this.procesando() || this.modo !== 'edicion' || !this.acuerdoConfirmado()) return;
    
    this.procesando.set(true);

    try {
      // 1. Validar Inventario
      const productosInventario = await this.inventoryService.getProductos().toPromise() || [];
      const currentItems = this.itemsEditables();
      
      for (const item of currentItems) {
        // Find if this item matches something in inventory by exact name or ID if linked
        const invItem = productosInventario.find((p: any) => 
          p.nombre.toLowerCase() === item.nombre_paquete_snapshot.toLowerCase() || 
          p.id === item.paquete_id
        );

        if (invItem) {
          // Check Stock
          if (invItem.stock < item.cantidad) {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Stock Insuficiente', 
              detail: `No hay suficiente stock para "${item.nombre_paquete_snapshot}". (Disponible: ${invItem.stock})` 
            });
            this.procesando.set(false);
            return; // Abort
          }
        } else {
           // Si no está en inventario, podríamos dar aviso o agregarlo. Por ahora pasamos.
           // Opcional: Podría preguntarse si se desea agregar.
        }
      }

      // 2. Si todo el stock es válido, armar Propuesta
      const propuestaData = {
        items: this.itemsEditables().map(item => ({
          paquete_id: item.paquete_id || null, 
          nombre_paquete_snapshot: item.nombre_paquete_snapshot,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          es_nuevo: item.es_nuevo
        })),
        total: this.totalCotizacion(),
        anticipo: this.montoAnticipo(),
        liquidacion: this.montoLiquidacion()
      };

      console.log('Enviando propuesta:', propuestaData);
      
      // Emit events and conclude
      this.enviarPropuesta.emit(propuestaData);
      
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cotización enviada correctamente' });

    } catch (error) {
       console.error('Error validando inventario', error);
       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al validar el inventario.' });
    } finally {
       this.procesando.set(false);
    }
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SolicitudDataService } from '../../services/solicitud-data.service';

@Component({
  selector: 'app-paquete-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paquete-detalle.component.html',
  styleUrl: './paquete-detalle.component.css'
})
export class PaqueteDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseDataService = inject(SupabaseDataService);
  private supabaseService = inject(SupabaseService);
  private location = inject(Location);
  private auth = inject(AuthService);
  private solicitudData = inject(SolicitudDataService);


  package = signal<any>(null);
  public Object = Object; // Make Object constructor available in template

  cantidadSeleccionada = signal(1);
  selectedIncluded = signal<Record<string, number>>({});
  expandedItems = signal<Record<string, boolean>>({});

  // Guardará { "Color de Silla": { tipo: "seleccion_unica", valores: ["Azul"], extra: 0 } }
  selectedVariants = signal<Record<string, any>>({});

  // Galería de imágenes
  currentImageIndex = signal(0);

  // Detectar si el usuario actual es el dueño del paquete
  isOwner = computed(() => {
    const pkg = this.package();
    const user = this.auth.currentUser();
    if (!pkg || !user) return false;
    return pkg.proveedor_usuario_id === user.id;
  });

  // Todas las imágenes del paquete
  allImages = computed(() => {
    const pkg = this.package();
    if (!pkg || !pkg.detalles_json || !pkg.detalles_json.imagenes || pkg.detalles_json.imagenes.length === 0) {
      return [{ url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=60', isPortada: true }];
    }
    return pkg.detalles_json.imagenes;
  });

  // Imagen actual según el índice
  currentImageUrl = computed(() => {
    const images = this.allImages();
    const index = this.currentImageIndex();
    return images[index]?.url || images[0]?.url;
  });

  coverImageUrl = computed(() => {
    const pkg = this.package();
    if (!pkg || !pkg.detalles_json || !pkg.detalles_json.imagenes || pkg.detalles_json.imagenes.length === 0) {
      return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=60'; // Default image
    }
    const portada = pkg.detalles_json.imagenes.find((img: any) => img.isPortada);
    return portada?.url || pkg.detalles_json.imagenes[0].url;
  });

  total = computed(() => {
    const pkg = this.package();
    if (!pkg) return 0;

    const basePrice = pkg.precio_base * this.cantidadSeleccionada();

    const includedTotal = Object.keys(this.selectedIncluded()).reduce((acc, key) => {
      const item = pkg.extra_charges.find((i: any) => i.nombre === key);
      const quantity = this.selectedIncluded()[key];
      return acc + (item.precio * quantity);
    }, 0);

    // Sumar el precio extra de las variantes seleccionadas (por unidad del paquete)
    const variantsState = this.selectedVariants();
    let variantTotal = 0;
    Object.keys(variantsState).forEach(varName => {
      const v = variantsState[varName];
      if (v.extra > 0) {
        variantTotal += v.extra;
      }
    });

    return basePrice + includedTotal + (variantTotal * this.cantidadSeleccionada());
  });

  incrementarCantidad() {
    this.cantidadSeleccionada.update(q => q + 1);
  }

  decrementarCantidad() {
    this.cantidadSeleccionada.update(q => q > 1 ? q - 1 : 1);
  }

  updateIncludedQuantity(name: string, delta: number) {
    this.selectedIncluded.update(curr => {
      const newQty = (curr[name] || 0) + delta;
      if (newQty <= 0) {
        const { [name]: removed, ...rest } = curr;
        return rest;
      }
      return { ...curr, [name]: newQty };
    });
  }

  getIncludedQuantity(name: string): number {
    return this.selectedIncluded()[name] || 0;
  }

  getExtraPrice(name: string): number {
    const pkg = this.package();
    if (!pkg || !pkg.extra_charges) return 0;
    const item = pkg.extra_charges.find((i: any) => i.nombre === name);
    return item?.precio || 0;
  }

  toggleItemExpanded(itemName: string) {
    this.expandedItems.update(curr => ({
      ...curr,
      [itemName]: !curr[itemName]
    }));
  }

  getVariantsForItem(itemName: string): any[] {
    const pkg = this.package();
    if (!pkg || !pkg.detalles_json || !pkg.detalles_json.variantes) return [];
    return pkg.detalles_json.variantes.filter((v: any) => v.item_asociado === itemName);
  }

  generalVariants = computed(() => {
    const pkg = this.package();
    if (!pkg || !pkg.detalles_json || !pkg.detalles_json.variantes) return [];
    return pkg.detalles_json.variantes.filter((v: any) => !v.item_asociado);
  });

  // ========== METODOS PARA VARIANTES ========== //
  getVariantKey(variante: any): string {
    return variante.item_asociado ? `${variante.item_asociado} - ${variante.nombre}` : variante.nombre;
  }

  toggleVariant(variante: any, opcion: any) {
    this.selectedVariants.update(curr => {
      const newState = { ...curr };
      const varName = this.getVariantKey(variante);

      if (!newState[varName]) {
        newState[varName] = { tipo: variante.tipo, valores: [], extra: 0 };
      }

      if (variante.tipo === 'seleccion_unica') {
        const isSame = newState[varName].valores.includes(opcion.label);
        // Si ya está seleccionada y no es requerida, la des-seleccionamos
        if (isSame && !variante.requerida) {
          delete newState[varName];
        } else {
          // Reemplaza por el nuevo valor
          newState[varName].valores = [opcion.label];
          newState[varName].extra = opcion.precio_extra || 0;
        }
      } else if (variante.tipo === 'seleccion_multiple') {
        // Toggle dentro del array
        const idx = newState[varName].valores.indexOf(opcion.label);
        if (idx !== -1) {
          newState[varName].valores.splice(idx, 1);
          newState[varName].extra -= (opcion.precio_extra || 0);
          if (newState[varName].valores.length === 0 && !variante.requerida) {
            delete newState[varName];
          }
        } else {
          newState[varName].valores.push(opcion.label);
          newState[varName].extra += (opcion.precio_extra || 0);
        }
      }
      return newState;
    });
  }

  updateVariantText(variante: any, text: string) {
    this.selectedVariants.update(curr => {
      const newState = { ...curr };
      const varName = this.getVariantKey(variante);
      if (!text || text.trim() === '') {
        if (!variante.requerida) delete newState[varName];
        else newState[varName] = { tipo: 'texto_libre', valores: [''], extra: 0 };
      } else {
        newState[varName] = { tipo: 'texto_libre', valores: [text], extra: 0 };
      }
      return newState;
    });
  }

  isVariantSelected(variante: any, opcionLabel: string): boolean {
    const varName = this.getVariantKey(variante);
    const sv = this.selectedVariants()[varName];
    if (!sv || !sv.valores) return false;
    return sv.valores.includes(opcionLabel);
  }
  // ============================================ //

  // Navegación de galería
  nextImage() {
    const images = this.allImages();
    if (images.length > 1) {
      this.currentImageIndex.update(i => (i + 1) % images.length);
    }
  }

  prevImage() {
    const images = this.allImages();
    if (images.length > 1) {
      this.currentImageIndex.update(i => (i - 1 + images.length) % images.length);
    }
  }

  selectImage(index: number) {
    this.currentImageIndex.set(index);
  }

  ngOnInit(): void {
    const packageId = this.route.snapshot.paramMap.get('id');
    console.log('Package ID from route:', packageId);
    if (packageId) {
      this.supabaseDataService.getPackageById(packageId).subscribe({
        next: (pkg) => {
          console.log('Package data received:', pkg);
          console.log('Items del paquete:', pkg.items_paquete);
          console.log('Número de items:', pkg.items_paquete?.length || 0);
          // Assuming 'detalles_json' might contain the extra charges
          if (pkg.detalles_json && pkg.detalles_json.cargos_adicionales && !pkg.extra_charges) {
            pkg.extra_charges = pkg.detalles_json.cargos_adicionales;
          }
          this.package.set(pkg);
        },
        error: (err) => {
          console.error('Error fetching package:', err);
        }
      });
    }
  }

  // Utilidad para verificar si un valor es un array
  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  // Utilidad para obtener las claves de un objeto
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  goBack(): void {
    this.location.back();
  }

  async goToCheckout() {
    const selection = this.selectedIncluded();
    const pkg = this.package();

    if (!pkg) {
      alert('Error: No se ha cargado el paquete.');
      return;
    }

    try {
      const user = this.auth.currentUser();
      if (!user) {
        alert('Inicia sesión para continuar');
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      // Prepare the selected package and its included items
      const paqueteSeleccionado = {
        ...pkg,
        cantidad: this.cantidadSeleccionada(),
        subtotal: this.total(), // use total computed property directly to pick up variants + extras
        variantes_seleccionadas: this.selectedVariants(),
        incluidos: Object.keys(selection).map(key => {
          const incluido = pkg.extra_charges.find((i: any) => i.nombre === key);
          return {
            ...incluido,
            cantidad: selection[key],
            subtotal: incluido.precio * selection[key]
          };
        })
      };

      const proveedorActual = pkg.perfil_proveedor;

      this.solicitudData.setPaquetesSeleccionados([paqueteSeleccionado]);
      this.solicitudData.setProveedorActual(proveedorActual);

      this.router.navigate(['/cliente/solicitudes/revisar']);

    } catch (e: any) {
      console.error('Error al procesar selección:', e);
      alert('Error al procesar selección: ' + (e.message || 'Error desconocido'));
    }
  }

  // Editar paquete (solo si es el dueño)
  editarPaquete() {
    if (!this.isOwner()) return;
    const pkg = this.package();
    if (!pkg) return;
    // Navegar a la página de edición de paquetes
    this.router.navigate(['/proveedor/paquetes'], {
      queryParams: { editar: pkg.id }
    });
  }

  // Eliminar paquete (solo si es el dueño)
  async eliminarPaquete() {
    if (!this.isOwner()) return;
    const pkg = this.package();
    if (!pkg) return;

    if (!confirm(`¿Estás seguro de eliminar el paquete "${pkg.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await this.supabaseService.getClient()
        .from('paquetes_proveedor')
        .delete()
        .eq('id', pkg.id);

      if (error) throw error;

      alert('Paquete eliminado exitosamente');
      this.router.navigate(['/proveedor/paquetes']);
    } catch (error: any) {
      console.error('Error al eliminar paquete:', error);
      alert('Error al eliminar el paquete: ' + error.message);
    }
  }
}

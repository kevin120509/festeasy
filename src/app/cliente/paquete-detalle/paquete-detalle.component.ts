import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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
  private location = inject(Location);
  private auth = inject(AuthService);

  package = signal<any>(null);
  public Object = Object; // Make Object constructor available in template

  cantidadSeleccionada = signal(1);
  selectedIncluded = signal<Record<string, number>>({});

  total = computed(() => {
    const pkg = this.package();
    if (!pkg) return 0;

    const basePrice = pkg.precio_base * this.cantidadSeleccionada();
    
    const includedTotal = Object.keys(this.selectedIncluded()).reduce((acc, key) => {
      const item = pkg.extra_charges.find((i: any) => i.nombre === key);
      const quantity = this.selectedIncluded()[key];
      return acc + (item.precio * quantity);
    }, 0);

    return basePrice + includedTotal;
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

  ngOnInit(): void {
    const packageId = this.route.snapshot.paramMap.get('id');
    console.log('Package ID from route:', packageId);
    if (packageId) {
      this.supabaseDataService.getPackageById(packageId).subscribe({
        next: (pkg) => {
          console.log('Package data received:', pkg);
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
            this.router.navigate(['/login']);
            return;
        }

        // Prepare the selected package and its included items
        const paqueteSeleccionado = {
            ...pkg,
            cantidad: this.cantidadSeleccionada(),
            subtotal: pkg.precio_base * this.cantidadSeleccionada(),
            incluidos: Object.keys(selection).map(key => {
                const incluido = pkg.extra_charges.find((i: any) => i.nombre === key);
                return {
                    ...incluido,
                    cantidad: selection[key],
                    subtotal: incluido.precio * selection[key]
                };
            })
        };

        // Get the provider info from the package
        const proveedorActual = pkg.perfil_proveedor;

        sessionStorage.setItem('paquetesSeleccionados', JSON.stringify([paqueteSeleccionado]));
        sessionStorage.setItem('proveedorActual', JSON.stringify(proveedorActual));

        this.router.navigate(['/cliente/solicitudes/revisar']);

    } catch (e: any) {
        console.error('Error al procesar selección:', e);
        alert('Error al procesar selección: ' + (e.message || 'Error desconocido'));
    }
  }
}

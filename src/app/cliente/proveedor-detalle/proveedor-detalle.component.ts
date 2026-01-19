import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { forkJoin, switchMap, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';
import { ProviderPackage } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-proveedor-detalle',
    standalone: true,
    imports: [CommonModule, HeaderComponent, RouterLink],
    templateUrl: './proveedor-detalle.html'
})
export class ProveedorDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ApiService);
    private auth = inject(AuthService);
    
    provider = signal<any>(null);
    packages = signal<ProviderPackage[]>([]);
    reviews = signal<any[]>([]);
    galeria = signal<string[]>([]);
    
    // Mapa de cantidades seleccionadas { [packageId]: quantity }
    selectedQuantities = signal<Record<string, number>>({});

    // Computed total
    totalSelection = computed(() => {
        const quant = this.selectedQuantities();
        const pkgs = this.packages();
        let total = 0;
        let count = 0;
        
        pkgs.forEach(p => {
            const q = quant[p.id] || 0;
            if (q > 0) {
                total += p.precio_base * q;
                count += q;
            }
        });
        return { total, count };
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarProveedor(id);
        }
    }

    cargarProveedor(id: string): void {
        this.api.getProviderProfile(id).pipe(
            switchMap(profile => {
                const providerData = {
                    id: profile.id,
                    usuario_id: profile.usuario_id,
                    nombre: profile.nombre_negocio,
                    categoria: profile.categoria_principal_id || 'Servicios',
                    descripcion: profile.descripcion,
                    rating: 4.8,
                    ubicacion: profile.direccion_formato,
                    imagen: profile.avatar_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=60',
                    reviews: 0
                };
                this.provider.set(providerData);
                
                return forkJoin({
                    packages: this.api.getPackagesByProviderId(profile.usuario_id || id),
                    reviews: this.api.getReviews(id)
                });
            })
        ).subscribe({
            next: ({ packages, reviews }) => {
                this.packages.set(packages);
                this.reviews.set(reviews.map((r: any, i: number) => ({ ...r, id: r.id || i, autor: r.autor || 'Cliente' })));
                this.provider.update(p => ({ ...p, reviews: reviews.length }));
            },
            error: (err) => console.error('Error cargando proveedor:', err)
        });

        this.galeria.set([
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=60',
            'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=60',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=60',
            'https://images.unsplash.com/photo-1496843916299-590492c751f4?auto=format&fit=crop&w=400&q=60'
        ]);
    }

    updateQuantity(pkg: ProviderPackage, delta: number): void {
        this.selectedQuantities.update(curr => {
            const newQty = (curr[pkg.id] || 0) + delta;
            if (newQty <= 0) {
                const { [pkg.id]: removed, ...rest } = curr;
                return rest;
            }
            return { ...curr, [pkg.id]: newQty };
        });
    }

    getQuantity(pkgId: string): number {
        return this.selectedQuantities()[pkgId] || 0;
    }

    async goToCheckout() {
        const selection = this.selectedQuantities();
        const pkgIds = Object.keys(selection);
        
        if (pkgIds.length === 0) return;

        // 1. Verificar si hay carrito activo, si no crear uno (Simplificado: asume que getCart maneja esto o creamos items directos)
        // Para este prototipo, vamos a guardar en localStorage los items seleccionados para pasarlos al checkout
        // o idealmente usar el backend. Vamos a intentar usar el backend si es posible, o simularlo.
        
        try {
            // Simulamos agregar al carrito backend uno por uno
            const user = this.auth.currentUser();
            if (!user) {
                alert('Inicia sesión para continuar');
                this.router.navigate(['/login']);
                return;
            }

            // Aquí idealmente obtendríamos el ID del carrito activo.
            // Por simplicidad, vamos a suponer que el componente Carrito obtiene el carrito activo del usuario
            // y nosotros solo insertamos items. Necesitamos el ID del carrito.
            // Si no tenemos ID de carrito, quizás el backend lo crea automático al insertar item (si la lógica backend lo soporta)
            // O obtenemos el carrito primero.
            
            this.api.getCart().subscribe({
                next: (cart) => {
                   this.addItemsToCart(cart.id, pkgIds, selection);
                },
                error: () => {
                   // Si falla (no hay carrito), creamos uno o manejamos error.
                   console.log('No cart found, creating logic implies backend handles it or we need createCart endpoint.');
                   // Fallback: LocalStorage for demo purposes if backend isn't fully ready
                   localStorage.setItem('temp_cart', JSON.stringify(selection));
                   this.router.navigate(['/cliente/carrito']);
                }
            });

        } catch (e) {
            console.error(e);
        }
    }

    private addItemsToCart(cartId: string, pkgIds: string[], selection: Record<string, number>) {
        const pkgs = this.packages();
        const promises = pkgIds.map(pid => {
            const pkg = pkgs.find(p => p.id === pid);
            if (!pkg) return null;
            
            return this.api.addToCart({
                carrito_id: cartId,
                paquete_id: pid,
                cantidad: selection[pid],
                precio_unitario_momento: pkg.precio_base
            }).toPromise();
        });

        Promise.all(promises).then(() => {
            this.router.navigate(['/cliente/carrito']);
        });
    }
}

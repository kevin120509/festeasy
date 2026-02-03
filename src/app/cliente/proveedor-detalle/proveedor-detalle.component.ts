import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ProviderPackage } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ResenasService } from '../../services/resenas.service';

@Component({
    selector: 'app-proveedor-detalle',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './proveedor-detalle.html'
})
export class ProveedorDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private resenasService = inject(ResenasService);

    provider = signal<any>(null);
    packages = signal<ProviderPackage[]>([]);
    reviews = signal<any[]>([]);
    galeria = signal<string[]>([]);

    // Mapa de cantidades seleccionadas { [packageId]: quantity }
    selectedQuantities = signal<Record<string, number>>({});

    // Control de descripciones expandidas
    expandedIndices = signal<Set<number>>(new Set());
    activeTab = signal<'servicios' | 'resenas'>('servicios');

    cambiarTab(tab: 'servicios' | 'resenas') {
        this.activeTab.set(tab);
    }

    toggleDescription(index: number, event: Event) {
        event.preventDefault();
        event.stopPropagation();
        this.expandedIndices.update(set => {
            const newSet = new Set(set);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }

    isExpanded(index: number): boolean {
        return this.expandedIndices().has(index);
    }

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
        console.log('📦 Cargando proveedor con ID:', id);

        this.api.getProviderProfile(id).pipe(
            switchMap(profile => {
                console.log('👤 Perfil obtenido:', profile);

                // Limpiar ubicación repetida
                const rawUbicacion = profile.direccion_formato || '';
                const cleanUbicacion = rawUbicacion.split(' (')[0].trim();

                const providerData = {
                    id: profile.id,
                    usuario_id: profile.usuario_id,
                    nombre: profile.nombre_negocio,
                    categoria: profile.categoria_principal_id || 'Servicios',
                    descripcion: profile.descripcion,
                    rating: 0, // Se actualizará con las stats
                    ubicacion: cleanUbicacion,
                    imagen: profile.avatar_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=60',
                    reviews: 0,
                    tipoSuscripcion: (profile.tipo_suscripcion_actual || 'basico').toLowerCase()
                };
                this.provider.set(providerData);

                const providerUserId = profile.usuario_id || id;
                console.log('📦 Buscando paquetes y stats para usuario_id:', providerUserId);

                return forkJoin({
                    packages: this.api.getPackagesByProviderId(providerUserId!),
                    reviews: this.resenasService.getResenasPorProveedor(providerUserId!),
                    stats: this.resenasService.getStatsProveedor(providerUserId!)
                });
            })
        ).subscribe({
            next: ({ packages, reviews, stats }) => {
                console.log('📦 Resultados:', { packages, reviews, stats });

                this.provider.update(p => ({
                    ...p,
                    rating: stats.promedio,
                    reviews: stats.total
                }));

                // If no packages found using usuario_id, try fallback using provider signal ID
                const currentProvider = this.provider();
                if ((!packages || packages.length === 0) && currentProvider?.id) {
                    console.warn('🔍 No se encontraron paquetes por usuario_id, probando por profile.id:', currentProvider.id);
                    this.api.getPackagesByProviderId(currentProvider.id).subscribe({
                        next: (altPackages: any[]) => {
                            console.log('🔍 Paquetes encontrados por profile.id:', altPackages);
                            this.packages.set(altPackages);
                        },
                        error: (err) => {
                            console.error('❌ Error buscando paquetes por profile.id:', err);
                            this.packages.set([]);
                        }
                    });
                } else {
                    this.packages.set(packages);
                }
                this.reviews.set(reviews.map((r: any, i: number) => ({ ...r, id: r.id || i, autor: r.perfil_cliente?.nombre_completo || 'Cliente' })));
                this.provider.update(p => ({ ...p, reviews: reviews.length }));
            },
            error: (err) => console.error('❌ Error cargando proveedor:', err)
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

    // Helper para obtener imagen del paquete desde detalles_json
    getPackageImage(pkg: ProviderPackage): string {
        if (pkg.detalles_json?.imagenes?.length > 0) {
            const portada = pkg.detalles_json.imagenes.find((img: any) => img.isPortada);
            return portada?.url || pkg.detalles_json.imagenes[0].url;
        }
        return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=60';
    }

    // Helper para obtener categoría del paquete
    getPackageCategory(pkg: any): string {
        return pkg.categoria?.nombre || 'Servicio';
    }

    // Helper para verificar si tiene servicios extras
    hasExtraServices(pkg: any): boolean {
        return (pkg.detalles_json?.cargos_adicionales?.length > 0) || (pkg.detalles_json?.servicios_extras?.length > 0);
    }

    async goToCheckout() {
        const selection = this.selectedQuantities();
        const pkgIds = Object.keys(selection);

        if (pkgIds.length === 0) {
            alert('Selecciona al menos un paquete');
            return;
        }

        try {
            const user = this.auth.currentUser();
            if (!user) {
                alert('Inicia sesión para continuar');
                this.router.navigate(['/login']);
                return;
            }

            // Guardar paquetes seleccionados para revisión
            const paquetesSeleccionados = pkgIds.map(pid => {
                const pkg = this.packages().find(p => p.id === pid);
                return {
                    ...pkg,
                    cantidad: selection[pid],
                    subtotal: (pkg?.precio_base || 0) * selection[pid]
                };
            });

            // Guardar proveedor actual también para mostrar datos en la siguiente pantalla
            const proveedorActual = this.provider();

            sessionStorage.setItem('paquetesSeleccionados', JSON.stringify(paquetesSeleccionados));
            sessionStorage.setItem('proveedorActual', JSON.stringify(proveedorActual));

            this.router.navigate(['/cliente/solicitudes/revisar']);

        } catch (e: any) {
            console.error('Error al procesar selección:', e);
            alert('Error al procesar selección: ' + (e.message || 'Error desconocido'));
        }
    }

    goBack(): void {
        this.router.navigate(['/cliente/marketplace']);
    }

    private async addItemsToCartAsync(cartId: string, pkgIds: string[], selection: Record<string, number>) {
        const pkgs = this.packages();

        for (const pid of pkgIds) {
            const pkg = pkgs.find(p => p.id === pid);
            if (!pkg) continue;

            await this.api.addToCart({
                carrito_id: cartId,
                paquete_id: pid,
                cantidad: selection[pid],
                precio_unitario_momento: pkg.precio_base
            }).toPromise();
        }
    }
}

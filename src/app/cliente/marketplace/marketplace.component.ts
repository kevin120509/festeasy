import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MarketplaceService } from './marketplace.service';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [FormsModule, RouterLink],
    templateUrl: './marketplace.html'
})
export class MarketplaceComponent implements OnInit {
    private api = inject(ApiService);
    private router = inject(Router);
    private marketplaceState = inject(MarketplaceService);

    providers = signal<any[]>([]);

    // Usar estado persistente
    searchQuery = this.marketplaceState.searchQuery;
    categoriaSeleccionada = this.marketplaceState.categoriaSeleccionada;

    eventoActual = signal<any>(null);

    // Filtros
    categorias = signal<any[]>([]);

    // Mapa de categorías por proveedor (basado en sus paquetes)
    // Key: usuario_id del proveedor, Value: Set de IDs de categorías que ofrece
    providerCategoriesMap = new Map<string, Set<string>>();

    goBack() {
        this.router.navigate(['/cliente/solicitudes/crear']);
    }

    // Mapping robusto de iconos de categoría (igual que en crear-evento)
    getCategoryIcon(token?: string): string {
        if (!token) return 'category';
        let t = (token || '')
            .toString()
            .toLowerCase()
            .normalize('NFKD')
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9_]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
        t = t.replace(/_icon$/, '');
        if (!t || t === 'icon') return 'category';
        if (t.includes('food') || t.includes('catering') || t.includes('comida')) return 'restaurant';
        if (t.includes('music') || t.includes('dj') || t.includes('sonido')) return 'music_note';
        if (t.includes('location') || t.includes('lugar') || t.includes('ubicacion')) return 'place';
        if (t.includes('decor') || t.includes('decoration') || t.includes('decoracion')) return 'palette';
        if (t.includes('photo') || t.includes('fotografia') || t.includes('fotogra')) return 'photo_camera';
        if (t.includes('drink') || t.includes('bebida') || t.includes('bebidas')) return 'local_bar';
        if (t.includes('furniture') || t.includes('mobiliario')) return 'deck';
        if (t.includes('entertain') || t.includes('entreten') || t.includes('show') || t.includes('enterta')) return 'theaters';
        if (/^[a-z_]{2,40}$/.test(t)) return t;
        return 'category';
    }

    ngOnInit(): void {
        const eventoStr = sessionStorage.getItem('eventoActual');
        if (eventoStr) {
            const evento = JSON.parse(eventoStr);
            this.eventoActual.set(evento);
            if (evento.categoriaId) {
                this.categoriaSeleccionada.set(evento.categoriaId);
            }
        }

        // Cargar categorías
        this.api.getServiceCategories().subscribe({
            next: (cats) => {
                console.log('📂 Categorías cargadas:', cats);
                // Filtrar para que no haya nombres repetidos en los botones
                const uniqueCats = (cats || []).filter((cat, index, self) =>
                    index === self.findIndex((t) => t.nombre === cat.nombre)
                );
                this.categorias.set(uniqueCats);
            },
            error: (err) => console.error('Error cargando categorías', err)
        });

        this.api.getProvidersWithLocation().subscribe({
            next: (profiles) => {
                console.log('🏪 Proveedores obtenidos:', profiles);
                const categoriesMap = new Map(this.categorias().map(c => [c.id, c.nombre]));
                const evento = this.eventoActual();

                // Obtener IDs de todos los proveedores para buscar sus paquetes
                const providerIds = profiles.map(p => p.usuario_id);

                // Buscar paquetes para saber qué categorías ofrece cada proveedor realmente
                this.api.getPackagesByProviderIds(providerIds).subscribe({
                    next: (packages) => {
                        console.log('📦 Paquetes de proveedores cargados:', packages);

                        // Construir mapa: Proveedor -> Categorías que ofrece
                        (packages || []).forEach(pkg => {
                            if (!pkg.proveedor_usuario_id) return;

                            if (!this.providerCategoriesMap.has(pkg.proveedor_usuario_id)) {
                                this.providerCategoriesMap.set(pkg.proveedor_usuario_id, new Set());
                            }
                            // Agregar categoría del paquete
                            if (pkg.categoria_servicio_id) {
                                this.providerCategoriesMap.get(pkg.proveedor_usuario_id)?.add(pkg.categoria_servicio_id);
                            }
                        });

                        this.processProviders(profiles, categoriesMap, evento);
                    },
                    error: (err) => {
                        console.error('❌ Error cargando paquetes de proveedores (se mostrarán sin filtrado avanzado):', err);
                        // Fallback: Mostrar proveedores aunque falle la carga de paquetes detallados
                        this.processProviders(profiles, categoriesMap, evento);
                    }
                });
            },
            error: (err) => console.error('❌ Error cargando proveedores:', err)
        });
    }

    private processProviders(profiles: any[], categoriesMap: Map<string, any>, evento: any) {
        let procesados = profiles.map(p => {
            let distancia = 0;
            if (evento?.coords && p.latitud && p.longitud) {
                distancia = this.calculateDistance(
                    evento.coords.lat, evento.coords.lng,
                    p.latitud, p.longitud
                );
            }

            // Añadir la categoría principal también al mapa
            if (p.categoria_principal_id) {
                if (!this.providerCategoriesMap.has(p.usuario_id)) {
                    this.providerCategoriesMap.set(p.usuario_id, new Set());
                }
                this.providerCategoriesMap.get(p.usuario_id)?.add(p.categoria_principal_id);
            }

            return {
                id: p.id,
                usuario_id: p.usuario_id,
                nombre: p.nombre_negocio,
                categoriaId: p.categoria_principal_id, // Mantenemos para referencia visual
                categoria: categoriesMap.get(p.categoria_principal_id) || 'Servicios',
                descripcion: p.descripcion,
                rating: 5.0,
                ubicacion: p.direccion_formato || 'Ciudad de México',
                imagen: p.avatar_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=500&q=60',
                distancia: distancia
            };
        });

        // Ordenar por distancia
        if (evento?.coords) {
            const someHaveCoords = procesados.some(p => p.distancia > 0);
            if (someHaveCoords) {
                procesados.sort((a, b) => a.distancia - b.distancia);
            }
        }

        this.providers.set(procesados);
    }

    filteredProviders = computed(() => {
        const query = this.searchQuery().toLowerCase();
        const catId = this.categoriaSeleccionada();

        return this.providers().filter(p => {
            const matchesQuery = !query || p.nombre.toLowerCase().includes(query);

            // Nuevo filtro: Coincide si el proveedor ofrece CUALQUIER paquete de esa categoría
            // O si su categoría principal es esa.
            let matchesCategory = !catId; // Si no hay filtro, match true

            if (catId) {
                const providerCats = this.providerCategoriesMap.get(p.usuario_id);
                // Verificar si el set de categorías del proveedor contiene la categoría seleccionada
                matchesCategory = providerCats ? providerCats.has(catId) : false;
            }

            return matchesQuery && matchesCategory;
        });
    });

    setCategory(id: string) {
        // Toggle selection
        this.categoriaSeleccionada.update(current => current === id ? '' : id);
    }

    // Haversine formula to calculate distance in km
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
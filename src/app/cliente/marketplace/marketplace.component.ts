import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD:src/app/cliente/marketplace/marketplace.ts
import { ApiService } from '../../services/api.service';

=======
import { HeaderComponent } from '../../shared/header/header';
import { MapaComponent } from '../../shared/mapa/mapa.component';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderPackage } from '../../models';
>>>>>>> 934db9194f24387cd7de91aab4f4a59d9a806e83:src/app/cliente/marketplace/marketplace.component.ts

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './marketplace.html'
})
export class MarketplaceComponent implements OnInit {
    searchQuery = '';
    selectedCategory = '';
    priceRange = '';

    private supabaseData = inject(SupabaseDataService);

    providers = signal<any[]>([]);
    categories = signal<string[]>([]);

    ngOnInit(): void {
        this.supabaseData.getAllPackages().subscribe(packages => {
            const providersData = packages.map(p => ({
                id: p.id,
                // Si la query incluye perfil_proveedor, p.perfil_proveedor?.nombre_negocio podría ser útil
                nombre: p.nombre,
<<<<<<< HEAD:src/app/cliente/marketplace/marketplace.ts
                // TODO: The backend ProviderPackage model does not have category, rating, location or image.
                // These are placeholder values.
                categoria: 'Categoría no especificada',
                precio: p.precio_base,
                rating: 4.5,
                ubicacion: 'Ubicación no especificada',
=======
                categoria: p.perfil_proveedor?.descripcion || 'Servicio', // Fallback
                precio: p.precio,
                rating: 4.5,
                ubicacion: p.perfil_proveedor?.direccion_formato || 'Ciudad de México',
>>>>>>> 934db9194f24387cd7de91aab4f4a59d9a806e83:src/app/cliente/marketplace/marketplace.component.ts
                imagen: '📦'
            }));
            this.providers.set(providersData);
        });

        // TODO: Implement a real endpoint for categories in the backend
        this.categories.set(['DJ / Sonido', 'Catering', 'Fotografía', 'Decoración', 'Iluminación', 'Pastelería']);
    }

    get filteredProviders() {
        return this.providers().filter(p => {
            const matchesSearch = !this.searchQuery ||
                p.nombre.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                p.categoria.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesCategory = !this.selectedCategory || p.categoria === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { MapaComponent } from '../../shared/mapa/mapa.component';
import { ApiService } from '../../services/api.service';
import { ProviderPackage } from '../../models';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent, MapaComponent],
    templateUrl: './marketplace.html'
})
export class MarketplaceComponent implements OnInit {
    searchQuery = '';
    selectedCategory = '';
    priceRange = '';

    private api = inject(ApiService);

    providers = signal<any[]>([]);
    categories = signal<string[]>([]);

    ngOnInit(): void {
        this.api.getProviderPackages().subscribe(packages => {
            const providersData = packages.map(p => ({
                id: p.id,
                nombre: p.nombre,
                // TODO: The backend ProviderPackage model does not have category, rating, location or image.
                // These are placeholder values.
                categoria: 'Categoría no especificada', 
                precio: p.precio_base,
                rating: 4.5, 
                ubicacion: 'Ubicación no especificada', 
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

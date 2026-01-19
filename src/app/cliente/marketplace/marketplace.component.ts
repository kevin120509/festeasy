import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { MapaComponent } from '../../shared/mapa/mapa.component';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderPackage } from '../../models';

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
                categoria: p.perfil_proveedor?.descripcion || 'Servicio', // Fallback
                precio: p.precio,
                rating: 4.5,
                ubicacion: p.perfil_proveedor?.direccion_formato || 'Ciudad de México',
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

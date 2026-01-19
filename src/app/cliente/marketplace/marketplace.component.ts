import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD
<<<<<<< HEAD:src/app/cliente/marketplace/marketplace.ts
import { ApiService } from '../../services/api.service';

=======
import { HeaderComponent } from '../../shared/header/header';
import { MapaComponent } from '../../shared/mapa/mapa.component';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderPackage } from '../../models';
>>>>>>> 934db9194f24387cd7de91aab4f4a59d9a806e83:src/app/cliente/marketplace/marketplace.component.ts
=======
import { ApiService } from '../../services/api.service';
>>>>>>> 553d26ac71eed52144ace4fe127f56db443c1025

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [FormsModule, RouterLink],
    templateUrl: './marketplace.html'
})
export class MarketplaceComponent implements OnInit {
    private api = inject(ApiService);
    providers = signal<any[]>([]);
    searchQuery = '';

    ngOnInit(): void {
        this.api.getProviderProfiles().subscribe(profiles => {
            this.providers.set(profiles.map(p => ({
                id: p.id,
<<<<<<< HEAD
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
=======
                usuario_id: p.usuario_id,
                nombre: p.nombre_negocio,
                categoria: p.descripcion || 'Servicios',
                ubicacion: p.direccion_formato || 'Ciudad de México',
                imagen: p.avatar_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=500&q=60',
                rating: 5.0
            })));
>>>>>>> 553d26ac71eed52144ace4fe127f56db443c1025
        });
    }

    get filteredProviders() {
        return this.providers().filter(p => !this.searchQuery || p.nombre.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }
}
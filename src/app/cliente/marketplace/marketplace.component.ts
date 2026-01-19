import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router'; // Fixed import
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';
import { MapaComponent } from '../../shared/mapa/mapa.component';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderPackage } from '../../models';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [FormsModule, RouterLink, HeaderComponent, MapaComponent],
    templateUrl: './marketplace.html'
})
export class MarketplaceComponent implements OnInit {
    private api = inject(ApiService);
    private supabaseData = inject(SupabaseDataService);
    providers = signal<any[]>([]);
    searchQuery = '';

    ngOnInit(): void {
        this.api.getProviderProfiles().subscribe(profiles => {
            this.providers.set(profiles.map(p => ({
                id: p.id,
                usuario_id: p.usuario_id,
                nombre: p.nombre_negocio,
                categoria: p.descripcion || 'Servicios',
                precio: p.precio_base || 0, // precio_base is now expected in ProviderProfile
                rating: 5.0,
                ubicacion: p.direccion_formato || 'Ciudad de México',
                imagen: p.avatar_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=500&q=60'
            })));
        });
    }

    get filteredProviders() {
        return this.providers().filter(p => !this.searchQuery || p.nombre.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }
}

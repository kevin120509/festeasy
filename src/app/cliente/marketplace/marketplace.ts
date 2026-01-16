import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { MapaComponent } from '../../shared/mapa/mapa.component';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent, MapaComponent],
    templateUrl: './marketplace.html'
})
export class MarketplaceComponent {
    searchQuery = '';
    selectedCategory = '';
    priceRange = '';

    providers = signal([
        { id: 1, nombre: 'Sonic Audio Visuals', categoria: 'DJ / Sonido', precio: 5000, rating: 4.9, ubicacion: 'Ciudad de México', imagen: '🎧' },
        { id: 2, nombre: 'Delicias Gourmet', categoria: 'Catering', precio: 8000, rating: 4.8, ubicacion: 'Guadalajara', imagen: '🍽️' },
        { id: 3, nombre: 'Foto Momentos', categoria: 'Fotografía', precio: 3500, rating: 4.7, ubicacion: 'Monterrey', imagen: '📷' },
        { id: 4, nombre: 'Flores del Valle', categoria: 'Decoración', precio: 4500, rating: 4.9, ubicacion: 'Ciudad de México', imagen: '🌸' },
        { id: 5, nombre: 'Luz y Magia', categoria: 'Iluminación', precio: 6000, rating: 4.6, ubicacion: 'Puebla', imagen: '💡' },
        { id: 6, nombre: 'Sweet Dreams Pasteles', categoria: 'Pastelería', precio: 2500, rating: 4.8, ubicacion: 'Querétaro', imagen: '🎂' }
    ]);

    categories = ['DJ / Sonido', 'Catering', 'Fotografía', 'Decoración', 'Iluminación', 'Pastelería'];

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

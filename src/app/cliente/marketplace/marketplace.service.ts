import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    searchQuery = signal('');
    searchLocation = signal('');
    categoriaSeleccionada = signal('');

    reset() {
        this.searchQuery.set('');
        this.searchLocation.set('');
        this.categoriaSeleccionada.set('');
    }
}

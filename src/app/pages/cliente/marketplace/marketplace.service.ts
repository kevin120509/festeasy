import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MarketplaceService {
    searchQuery = signal('');
    categoriaSeleccionada = signal('');

    reset() {
        this.searchQuery.set('');
        this.categoriaSeleccionada.set('');
    }
}

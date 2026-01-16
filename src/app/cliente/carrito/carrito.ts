import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [RouterLink, HeaderComponent],
    templateUrl: './carrito.html'
})
export class CarritoComponent {
    private api = inject(ApiService);

    currentStep = signal(2); // 1: Selección, 2: Revisión, 3: Pago, 4: Confirmación

    items = signal([
        { id: 1, nombre: 'Paquete Premium DJ', proveedor: 'Sonic Audio Visuals', precio: 8500, cantidad: 1 },
        { id: 2, nombre: 'Catering 50 personas', proveedor: 'Delicias Gourmet', precio: 12000, cantidad: 1 },
        { id: 3, nombre: 'Fotografía 6 horas', proveedor: 'Foto Momentos', precio: 5500, cantidad: 1 }
    ]);

    get subtotal() {
        return this.items().reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    get comision() {
        return this.subtotal * 0.05;
    }

    get total() {
        return this.subtotal + this.comision;
    }

    removeItem(id: number) {
        this.items.update(items => items.filter(i => i.id !== id));
    }

    checkout() {
        this.currentStep.set(3);
        // Simulate payment
        setTimeout(() => {
            this.currentStep.set(4);
        }, 2000);
    }
}

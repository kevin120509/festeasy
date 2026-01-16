import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { Cart } from '../../models';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [RouterLink, HeaderComponent],
    templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
    private api = inject(ApiService);

    currentStep = signal(2); // 1: Selección, 2: Revisión, 3: Pago, 4: Confirmación

    items = signal<any[]>([]);

    ngOnInit(): void {
        this.api.getCart().subscribe(cart => {
            // Assuming the backend returns the cart with items and populated package/provider info
            const mappedItems = (cart.items || []).map((item: any) => ({
                id: item.id,
                nombre: item.paquete?.nombre || 'Nombre no disponible',
                proveedor: item.paquete?.proveedor?.nombre_negocio || 'Proveedor no disponible',
                precio: item.precio_unitario_momento,
                cantidad: item.cantidad
            }));
            this.items.set(mappedItems);
        });
    }

    get subtotal() {
        return this.items().reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    get comision() {
        return this.subtotal * 0.05;
    }

    get total() {
        return this.subtotal + this.comision;
    }

    removeItem(id: string) {
        this.api.deleteCartItem(id.toString()).subscribe(() => {
            this.items.update(items => items.filter(i => i.id !== id));
        });
    }

    checkout() {
        this.currentStep.set(3);
        // Simulate payment
        setTimeout(() => {
            this.currentStep.set(4);
        }, 2000);
    }
}

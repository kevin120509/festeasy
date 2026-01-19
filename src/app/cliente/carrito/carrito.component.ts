import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { Cart } from '../../models';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
    private api = inject(ApiService);

    currentStep = signal(1); // 1: Carrito, 2: Checkout (Revisión/Pago)

    items = signal<any[]>([]);

    ngOnInit(): void {
        this.api.getCart().subscribe(cart => {
            // Assuming the backend returns the cart with items and populated package/provider info
            // In a real app we'd map this differently
            const mappedItems = (cart.items || []).map((item: any) => ({
                id: item.id,
                nombre: item.paquete?.nombre || 'Nombre no disponible',
                proveedor: item.paquete?.proveedor?.nombre_negocio || 'Proveedor no disponible',
                precio: item.precio_unitario_momento,
                cantidad: item.cantidad,
                // Add mock image if missing
                imagen: item.paquete?.detalles_json?.imagen || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB31prd2W0_sAbtbWkXGiHgrcPNicDjHo07ZV4hi__T3cYxbGHOFHxGapsy_UyvMBmQCK3WQ_uo5AYBCMW50TgnifVT8BGCd_tRbFn7UCSUsQKTF8nhYspjJjyoJWGnVeTa7_PG0L90yfaYgZ7a9GlN1KLFiWT5oncaEhEnv438gbzNO7--WS4U2-z3WPvor0VGMqAgtZVHo6JPBg4vtHMb-nehy7akS50N6lABQ4Dxjd3yOUeLaUJwBsN8zomuG5UjEjpWa0P4Sa0'
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

    get impuestos() {
        // Mock taxes from the cart design (approx 7%)
        return this.subtotal * 0.07;
    }

    get total() {
        return this.subtotal + this.comision + this.impuestos;
    }

    removeItem(id: string) {
        this.api.deleteCartItem(id.toString()).subscribe(() => {
            this.items.update(items => items.filter(i => i.id !== id));
        });
    }

    proceedToCheckout() {
        this.currentStep.set(2);
        window.scrollTo(0, 0);
    }

    checkout() {
        if (this.currentStep() === 2) {
            // Confirm payment
            alert('Procesando pago... (Simulación)');
            // Ideally navigate to success page or show success modal
        }
    }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);

    currentStep = signal(1); // 1: Carrito, 2: Checkout (Revisión/Pago)

    items = signal<any[]>([]);
    
    // Request info for checkout
    requestInfo = signal<any>({
        fecha: 'Por definir',
        hora: 'Por definir',
        direccion: 'Ubicación pendiente'
    });

    ngOnInit(): void {
        this.loadCart();
        this.loadRequestInfo();
    }

    loadCart() {
        this.api.getCart().subscribe(cart => {
            const mappedItems = (cart.items || []).map((item: any) => ({
                id: item.id,
                nombre: item.paquete?.nombre || 'Nombre no disponible',
                proveedor: item.paquete?.proveedor?.nombre_negocio || 'Proveedor no disponible',
                precio: item.precio_unitario_momento,
                cantidad: item.cantidad,
                imagen: item.paquete?.detalles_json?.imagen || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB31prd2W0_sAbtbWkXGiHgrcPNicDjHo07ZV4hi__T3cYxbGHOFHxGapsy_UyvMBmQCK3WQ_uo5AYBCMW50TgnifVT8BGCd_tRbFn7UCSUsQKTF8nhYspjJjyoJWGnVeTa7_PG0L90yfaYgZ7a9GlN1KLFiWT5oncaEhEnv438gbzNO7--WS4U2-z3WPvor0VGMqAgtZVHo6JPBg4vtHMb-nehy7akS50N6lABQ4Dxjd3yOUeLaUJwBsN8zomuG5UjEjpWa0P4Sa0'
            }));
            this.items.set(mappedItems);
        });
    }

    loadRequestInfo() {
        // Try to fetch the latest active request for this client
        // This is a heuristic: we grab the most recent request
        this.api.getClientRequests().subscribe(requests => {
            if (requests && requests.length > 0) {
                // Sort by date created desc
                const latest = requests.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())[0];
                
                this.requestInfo.set({
                    fecha: new Date(latest.fecha_servicio).toLocaleDateString('es-MX'),
                    hora: new Date(latest.fecha_servicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                    direccion: latest.direccion_servicio || 'Ubicación remota'
                });
            }
        });
    }

    get subtotal() {
        return this.items().reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    get comision() {
        return this.subtotal * 0.05;
    }

    get impuestos() {
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
            alert('Procesando pago... (Simulación)');
            // Here we would call api.processPayment()
        }
    }
}
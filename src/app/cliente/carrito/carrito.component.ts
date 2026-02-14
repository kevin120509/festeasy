import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudDataService } from '../../services/solicitud-data.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-carrito',
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule],
    templateUrl: './carrito.html'
})
export class CarritoComponent implements OnInit, OnDestroy {
    private solicitudDataService = inject(SolicitudDataService);
    private router = inject(Router);
    private api = inject(ApiService);
    private auth = inject(AuthService);
    private carritoSubscription: Subscription | undefined;

    items = signal<any[]>([]);
    isLoading = signal<boolean>(false);
    notification = signal<{ message: string, type: 'success' | 'error' } | null>(null);

    constructor() { }

    ngOnInit(): void {
        this.carritoSubscription = this.solicitudDataService.getCarrito().subscribe(carrito => {
            this.items.set(carrito);
        });
    }

    ngOnDestroy(): void {
        if (this.carritoSubscription) {
            this.carritoSubscription.unsubscribe();
        }
    }

    get total() {
        return this.items().reduce((sum, item) => sum + item.total, 0);
    }

    removeItem(id: number) {
        this.solicitudDataService.removerDelCarrito(id);
    }

    async enviarTodasLasSolicitudes() {
        this.isLoading.set(true);
        const user = this.auth.currentUser();
        if (!user) {
            this.notification.set({ message: 'Debes iniciar sesión para continuar', type: 'error' });
            setTimeout(() => this.router.navigate(['/login']), 2500);
            return;
        }

        const itemsToSend = [...this.items()];
        const createdIds: string[] = [];

        try {
            for (const item of itemsToSend) {
                const id = await this.solicitudDataService.enviarSolicitud(item, user);
                if (id) createdIds.push(id);
            }

            this.solicitudDataService.limpiarCarrito();

            this.notification.set({ message: 'Todas las solicitudes han sido enviadas', type: 'success' });
            setTimeout(() => {
                this.router.navigate(['/cliente/dashboard']);
            }, 1500);
        } catch (error: any) {
            this.notification.set({ message: 'Error al enviar una o más solicitudes: ' + error.message, type: 'error' });
        } finally {
            this.isLoading.set(false);
        }
    }

    verDetalle(item: any) {
        this.solicitudDataService.setEventoActual(item.evento);
        this.solicitudDataService.setPaquetesSeleccionados(item.paquetes);
        this.solicitudDataService.setProveedorActual(item.proveedor);
        this.router.navigate(['/cliente/solicitudes/revisar']);
    }
}
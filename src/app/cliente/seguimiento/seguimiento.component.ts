import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-seguimiento-evento',
    standalone: true,
    imports: [CommonModule, RouterLink, HeaderComponent],
    templateUrl: './seguimiento.component.html'
})
export class SeguimientoEventoComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private api = inject(ApiService);
    
    loading = signal(true);
    evento = signal<any>(null);
    items = signal<any[]>([]);
    
    // Countdown signals
    diasRestantes = signal(0);
    horasRestantes = signal(0);
    private timer: any;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarDetalles(id);
        }
    }

    cargarDetalles(id: string) {
        this.loading.set(true);
        forkJoin({
            evento: this.api.getRequestById(id),
            items: this.api.getRequestItems(id)
        }).subscribe({
            next: ({ evento, items }) => {
                console.log('✅ Detalles de Seguimiento Cargados:', { evento, items });

                if (!evento) {
                    throw new Error('No se encontró la solicitud.');
                }

                // Si no hay items en items_solicitud, intentar fallback a paquetes del proveedor
                if (!items || items.length === 0) {
                    console.warn(`⚠️ No se encontraron paquetes para la solicitud ${id}. Intentando fallback a paquetes del proveedor...`);
                    const providerProfile = evento.perfil_proveedor || (evento.proveedor ? evento.proveedor : null);
                    const providerUserId = providerProfile?.usuario_id || providerProfile?.id || evento.proveedor_usuario_id;

                    if (providerUserId) {
                        this.api.getPackagesByProviderId(providerUserId).subscribe({
                            next: (pkgs: any[]) => {
                                console.log('🔁 Paquetes fallback desde proveedor:', pkgs);
                                const fallbackItems = (pkgs || []).map(p => ({
                                    id: p.id,
                                    paquete_id: p.id,
                                    nombre_paquete_snapshot: p.nombre || 'Paquete',
                                    cantidad: 1,
                                    precio_unitario: p.precio_base || 0
                                }));

                                this.evento.set(evento);
                                this.items.set(fallbackItems);
                                this.iniciarCountdown(evento.fecha_servicio);
                                this.loading.set(false);
                            },
                            error: (err) => {
                                console.error('❌ Error obteniendo paquetes del proveedor para fallback:', err);
                                this.evento.set(evento);
                                this.items.set([]);
                                this.loading.set(false);
                            }
                        });
                        return; // No continuar, el fallback manejará el set
                    }
                }

                this.evento.set(evento);
                this.items.set(items);
                this.iniciarCountdown(evento.fecha_servicio);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('❌ Error fatal cargando detalles del evento:', err);
                this.loading.set(false);
                this.evento.set(null); // Asegurarse de que no se muestren datos viejos
            }
        });
    }

    iniciarCountdown(fechaStr: string) {
        const target = new Date(fechaStr).getTime();
        
        this.actualizarTiempo(target);
        this.timer = setInterval(() => this.actualizarTiempo(target), 1000 * 60); // Update every minute
    }

    actualizarTiempo(target: number) {
        const now = new Date().getTime();
        const diff = target - now;

        if (diff > 0) {
            this.diasRestantes.set(Math.floor(diff / (1000 * 60 * 60 * 24)));
            this.horasRestantes.set(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        } else {
            this.diasRestantes.set(0);
            this.horasRestantes.set(0);
        }
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }
}
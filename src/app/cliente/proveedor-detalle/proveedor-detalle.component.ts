import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, switchMap, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';
import { ProviderPackage } from '../../models';

@Component({
    selector: 'app-proveedor-detalle',
    standalone: true,
    imports: [CommonModule, HeaderComponent, RouterLink],
    templateUrl: './proveedor-detalle.html'
})
export class ProveedorDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private api = inject(ApiService);
    
    provider = signal<any>(null);
    packages = signal<ProviderPackage[]>([]);
    reviews = signal<any[]>([]);
    galeria = signal<string[]>([]);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cargarProveedor(id);
        }
    }

    cargarProveedor(id: string): void {
        this.api.getProviderProfile(id).pipe(
            switchMap(profile => {
                const providerData = {
                    id: profile.id,
                    usuario_id: profile.usuario_id,
                    nombre: profile.nombre_negocio,
                    categoria: profile.categoria_principal_id || 'Servicios',
                    descripcion: profile.descripcion,
                    rating: 4.8,
                    ubicacion: profile.direccion_formato,
                    imagen: profile.avatar_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=60',
                    reviews: 0
                };
                this.provider.set(providerData);
                
                return forkJoin({
                    packages: this.api.getPackagesByProviderId(profile.usuario_id || id),
                    reviews: this.api.getReviews(id)
                });
            })
        ).subscribe({
            next: ({ packages, reviews }) => {
                this.packages.set(packages);
                this.reviews.set(reviews.map((r: any, i: number) => ({ ...r, id: r.id || i, autor: r.autor || 'Cliente' })));
                this.provider.update(p => ({ ...p, reviews: reviews.length }));
            },
            error: (err) => console.error('Error cargando proveedor:', err)
        });

        // Galería placeholder
        this.galeria.set([
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=60',
            'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=60',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=60',
            'https://images.unsplash.com/photo-1496843916299-590492c751f4?auto=format&fit=crop&w=400&q=60'
        ]);
    }

    addToCart(pkg: ProviderPackage): void {
        // TODO: Implementar lógica de carrito
        alert(`${pkg.nombre} agregado al carrito`);
    }
}
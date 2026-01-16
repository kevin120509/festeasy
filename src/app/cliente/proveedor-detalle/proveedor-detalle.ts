import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap, map, forkJoin } from 'rxjs';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { ProviderProfile, ProviderPackage } from '../../models';

@Component({
    selector: 'app-proveedor-detalle',
    standalone: true,
    imports: [HeaderComponent],
    templateUrl: './proveedor-detalle.html'
})
export class ProveedorDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private api = inject(ApiService);

    provider = signal<any>({});
    packages = signal<ProviderPackage[]>([]);
    galeria = signal<string[]>([]); // TODO: Implement gallery in backend
    reviews = signal<any[]>([]);

    ngOnInit(): void {
        const providerId = this.route.snapshot.paramMap.get('id');
        if (providerId) {
            const profile$ = this.api.getProviderProfile(providerId);
            const reviews$ = this.api.getReviews(providerId);

            forkJoin({
                profile: profile$,
                reviews: reviews$
            }).pipe(
                switchMap(({ profile, reviews }) => {
                    const providerData = {
                        id: profile.id,
                        nombre: profile.nombre_negocio,
                        categoria: profile.categoria_principal_id,
                        descripcion: profile.descripcion,
                        rating: 4.8, // Placeholder
                        ubicacion: profile.direccion_formato,
                        imagen: profile.avatar_url || '🏢',
                        reviews: reviews.length
                    };
                    this.provider.set(providerData);
                    this.reviews.set(reviews);

                    return this.api.getProviderPackages().pipe(
                        map(allPackages => allPackages.filter(p => p.proveedor_usuario_id === profile.usuario_id))
                    );
                })
            ).subscribe(providerPackages => {
                this.packages.set(providerPackages);
            });

            // Placeholder data for gallery
            this.galeria.set(['🎵', '🎶', '🎤', '🔊']);
        }
    }

    addToCart(pkg: any) {
        // TODO: Implement cart logic
        alert(`${pkg.nombre} agregado al carrito`);
    }
}



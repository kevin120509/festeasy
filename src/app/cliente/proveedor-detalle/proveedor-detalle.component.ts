import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-proveedor-detalle',
    standalone: true,
    imports: [CommonModule, HeaderComponent, RouterLink],
    templateUrl: './proveedor-detalle.component.html'
})
export class ProveedorDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private api = inject(ApiService);
    provider = signal<any>(null);
    packages = signal<any[]>([]);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.api.getProviderProfile(id).subscribe(p => this.provider.set(p));
            this.api.getPackagesByProviderId(id).subscribe(pkgs => this.packages.set(pkgs));
        }
    }
}
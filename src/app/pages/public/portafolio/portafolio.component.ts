import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseDataService } from '../../../services/supabase-data.service';
import { ProviderProfile } from '../../../models';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-portafolio',
    standalone: true,
    imports: [CommonModule, CurrencyPipe],
    template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header / Banner -->
      <div class="h-64 bg-primary relative overflow-hidden">
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8 text-white bg-gradient-to-t from-black/60 to-transparent">
          <div class="max-w-6xl mx-auto flex items-end gap-6">
            <div class="h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl">
              <img *ngIf="profile()?.avatar_url" [src]="profile()?.avatar_url" class="h-full w-full object-cover" alt="Profile Avatar">
              <div *ngIf="!profile()?.avatar_url" class="h-full w-full flex items-center justify-center bg-slate-100 text-primary text-4xl font-black">
                {{ profile()?.nombre_negocio?.charAt(0) }}
              </div>
            </div>
            <div class="mb-2">
              <h1 class="text-4xl font-black">{{ profile()?.nombre_negocio }}</h1>
              <p class="text-white/80 flex items-center gap-2">
                <span class="material-icons-outlined text-sm">location_on</span>
                {{ profile()?.direccion_formato }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Left: Info -->
        <div class="md:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-800 mb-4">Sobre nosotros</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              {{ profile()?.descripcion || 'Este proveedor aún no ha añadido una descripción.' }}
            </p>
            
            <div class="mt-6 pt-6 border-t border-slate-50 space-y-3">
              <div class="flex items-center gap-3 text-slate-500 text-sm">
                <span class="material-icons-outlined text-primary">phone</span>
                {{ profile()?.telefono }}
              </div>
              <div class="flex items-center gap-3 text-slate-500 text-sm">
                <span class="material-icons-outlined text-primary">mail</span>
                {{ profile()?.correo_electronico }}
              </div>
            </div>
          </div>
          
          <button class="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            Contactar ahora
          </button>
        </div>

        <!-- Right: Packages -->
        <div class="md:col-span-2 space-y-6">
          <h2 class="text-2xl font-black text-slate-800">Nuestros Paquetes</h2>
          
          <div *ngIf="loading()" class="text-center py-12">
             <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (pkg of packages(); track pkg.id) {
              <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
                <div class="p-6">
                  <h3 class="font-bold text-slate-800 group-hover:text-primary transition-colors">{{ pkg.nombre }}</h3>
                  <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ pkg.descripcion }}</p>
                  
                  <div class="mt-4 flex justify-between items-end">
                    <div>
                      <p class="text-[10px] text-slate-400 font-bold uppercase">Desde</p>
                      <p class="text-xl font-black text-primary">{{ pkg.precio_base | currency:'MXN' }}</p>
                    </div>
                    <button class="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all">
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p class="text-slate-400">Este proveedor aún no tiene paquetes publicados.</p>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
    styles: []
})
export class PortafolioComponent implements OnInit {
    route = inject(ActivatedRoute);
    supabaseData = inject(SupabaseDataService);

    profile = signal<ProviderProfile | null>(null);
    packages = signal<any[]>([]);
    loading = signal(true);

    ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('negocio');
        if (slug) {
            this.loadData(slug);
        }
    }

    loadData(slug: string) {
        this.loading.set(true);
        // Buscamos al proveedor por su slug (nombre_negocio normalizado)
        this.supabaseData.getProviders().subscribe((providers: any[]) => {
            const provider = providers.find((p: any) =>
                p.usuario_id === slug || p.id === slug || p.nombre_negocio?.toLowerCase().replace(/\s+/g, '-') === slug
            );

            if (provider) {
                this.profile.set(provider);
                this.supabaseData.getProviderPackages(provider.usuario_id).subscribe(pkgs => {
                    this.packages.set(pkgs.filter(p => p.estado === 'publicado'));
                    this.loading.set(false);
                });
            } else {
                this.loading.set(false);
            }
        });
    }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderPublicPage } from '../../models';

@Component({
    selector: 'app-provider-public-page',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-white" *ngIf="page(); else loadingTemplate">
      <!-- Hero Section -->
      <section class="relative h-[70vh] flex items-center overflow-hidden" 
               [ngClass]="{
                 'justify-start text-left': page()?.hero_alignment === 'left',
                 'justify-center text-center': page()?.hero_alignment === 'center',
                 'justify-end text-right': page()?.hero_alignment === 'right'
               }">
        
        <!-- Background Image -->
        <div class="absolute inset-0 z-0">
          <img [src]="page()?.hero_image || 'assets/images/default-hero.jpg'" 
               class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/40"></div>
        </div>

        <!-- Content -->
        <div class="container mx-auto px-6 relative z-10 text-white">
          <div class="max-w-3xl" [ngClass]="{'ml-auto': page()?.hero_alignment === 'right', 'mx-auto': page()?.hero_alignment === 'center'}">
            <h1 class="text-5xl md:text-7xl font-black mb-6 animate-in slide-in-from-bottom duration-700">
              {{ page()?.slogan || 'Bienvenidos a nuestra experiencia' }}
            </h1>
            <p class="text-xl md:text-2xl text-white/90 leading-relaxed animate-in slide-in-from-bottom delay-200 duration-700">
              {{ page()?.description }}
            </p>
            
            <div class="mt-10 flex flex-wrap gap-4" [ngClass]="{'justify-center': page()?.hero_alignment === 'center', 'justify-end': page()?.hero_alignment === 'right'}">
              <a [href]="'tel:' + page()?.contact_phone" 
                 class="bg-primary hover:bg-primary-600 text-white font-bold py-4 px-8 rounded-full transition-all flex items-center gap-2">
                <span class="material-icons-outlined">phone</span>
                Llamar ahora
              </a>
              <a [href]="'https://wa.me/' + page()?.contact_whatsapp" 
                 target="_blank"
                 class="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full transition-all flex items-center gap-2">
                <span class="material-icons-outlined">chat</span>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Gallery Section -->
      <section class="py-20 bg-slate-50" *ngIf="page()?.gallery?.length">
        <div class="container mx-auto px-6">
          <h2 class="text-3xl font-black text-slate-800 mb-12 text-center">Nuestra Galería</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let img of page()?.gallery" class="aspect-square rounded-2xl overflow-hidden shadow-lg group">
              <img [src]="img" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            </div>
          </div>
        </div>
      </section>

      <!-- Footer / Contact -->
      <footer class="py-12 bg-slate-900 text-white">
        <div class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <p class="text-slate-400 text-sm">© 2026 Powered by FestEasy</p>
          </div>
          <div class="flex gap-6">
             <a *ngIf="page()?.contact_email" [href]="'mailto:' + page()?.contact_email" class="text-slate-300 hover:text-white transition-colors">
               {{ page()?.contact_email }}
             </a>
          </div>
        </div>
      </footer>
    </div>

    <ng-template #loadingTemplate>
      <div class="min-h-screen flex items-center justify-center bg-white">
        <div class="text-center">
          <div class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></div>
          <p class="text-slate-500 font-bold">Cargando tu página...</p>
        </div>
      </div>
    </ng-template>
  `,
    styles: [`
    :host { display: block; }
    .hero-left { text-align: left; }
    .hero-center { text-align: center; }
    .hero-right { text-align: right; }
  `]
})
export class ProviderPublicPageComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private supabaseData = inject(SupabaseDataService);

    page = signal<ProviderPublicPage | null>(null);

    ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
            this.loadPage(slug);
        }
    }

    async loadPage(slug: string) {
        try {
            const data = await this.supabaseData.getProviderPublicPage(slug);
            if (data) {
                this.page.set(data);
            }
        } catch (error) {
            console.error('Error loading public page:', error);
        }
    }
}

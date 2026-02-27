import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { ProviderPublicPage } from '../../models';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-provider-public-page',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <div class="min-h-screen bg-white" *ngIf="page(); else loadingTemplate">
      <!-- Hero Section -->
      <section class="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900" 
               [ngClass]="{
                 'justify-start text-left': page()?.hero_alignment === 'left',
                 'justify-center text-center': page()?.hero_alignment === 'center',
                 'justify-end text-right': page()?.hero_alignment === 'right'
               }">
        
        <!-- Background Image & Atmospheric Layers -->
        <div class="absolute inset-0 z-0 scale-105 transition-transform duration-[20s] ease-linear overflow-hidden"
             [ngClass]="{'scale-110': page()?.theme === 'futuristic'}">
          <img [src]="page()?.hero_image || 'assets/images/default-hero.jpg'" 
               class="w-full h-full object-cover">
          
          <!-- Dynamic Overlay -->
          <div class="absolute inset-0" 
               [style.background-color]="'rgba(0,0,0,' + (page()?.hero_overlay_opacity || 60) / 100 + ')'"></div>

          <!-- Theme Specific Background Effects -->
          <div *ngIf="page()?.theme === 'futuristic'" 
               class="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-screen"
               [style.background]="'radial-gradient(circle at center, ' + (page()?.accent_color || '#22c55e') + '44 0%, transparent 70%)'"></div>
          
          <div *ngIf="page()?.theme === 'elegant'" 
               class="absolute inset-0 z-10 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <!-- Content -->
        <div class="container mx-auto px-6 relative z-10 text-white">
          <div class="max-w-4xl transition-all duration-1000" 
               [ngClass]="{
                 'ml-auto': page()?.hero_alignment === 'right', 
                 'mx-auto': page()?.hero_alignment === 'center',
                 'p-8 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl': page()?.theme === 'futuristic'
               }"
               [style.border-color]="page()?.theme === 'futuristic' ? (page()?.accent_color || '#22c55e') + '33' : 'transparent'">
            
            <!-- HUD / Tag Element -->
            <div *ngIf="page()?.theme === 'futuristic'" 
                 class="inline-flex items-center gap-2 py-2 px-4 mb-8 rounded-full border text-[10px] font-black tracking-[0.2em] uppercase backdrop-blur-xl animate-pulse"
                 [style.color]="page()?.accent_color || '#22c55e'"
                 [style.border-color]="(page()?.accent_color || '#22c55e') + '66'"
                 [style.box-shadow]="'0 0 20px ' + (page()?.accent_color || '#22c55e') + '33'">
                 <span class="w-2 h-2 rounded-full bg-current"></span>
                 ESTADO: ONLINE // SISTEMA: {{ page()?.slug?.toUpperCase() }}
            </div>

            <h1 class="text-6xl md:text-9xl font-black mb-8 animate-in slide-in-from-bottom duration-1000 leading-[0.9] tracking-tighter"
                [style.text-shadow]="page()?.theme === 'futuristic' ? '0 0 40px ' + (page()?.accent_color || '#22c55e') + '88' : 'none'">
              {{ page()?.slogan || 'Bienvenidos a nuestra experiencia' }}
            </h1>
            
            <p class="text-xl md:text-3xl text-white/80 leading-relaxed mb-12 animate-in slide-in-from-bottom delay-300 duration-1000 max-w-2xl font-light"
               [ngClass]="{'mx-auto': page()?.hero_alignment === 'center', 'ml-auto': page()?.hero_alignment === 'right'}"
               [style.font-family]="page()?.theme === 'elegant' ? 'serif' : 'inherit'">
              {{ page()?.description }}
            </p>
            
            <!-- CTAs -->
            <div class="flex flex-wrap gap-6" [ngClass]="{'justify-center': page()?.hero_alignment === 'center', 'justify-end': page()?.hero_alignment === 'right'}">
              <a [href]="'tel:' + page()?.contact_phone" 
                 class="group relative px-12 py-6 rounded-2xl transition-all flex items-center gap-3 font-black text-xl shadow-2xl hover:-translate-y-2 hover:brightness-110 active:scale-95 overflow-hidden"
                 [style.background-color]="page()?.primary_color || '#ef4444'">
                <div class="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span class="material-icons">phone</span>
                Llamar ahora
              </a>
              <a [href]="'https://wa.me/' + (page()?.contact_whatsapp || page()?.contact_phone)" 
                 target="_blank"
                 class="group relative px-12 py-6 rounded-2xl transition-all flex items-center gap-3 font-black text-xl shadow-2xl hover:-translate-y-2 hover:brightness-110 active:scale-95 overflow-hidden border border-white/10"
                 [style.background-color]="page()?.accent_color || '#22c55e'">
                <div class="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span class="material-icons">chat</span>
                WhatsApp
              </a>
            </div>

            <!-- Scroll Indicator -->
            <div class="mt-16 flex justify-center opacity-40 animate-bounce">
               <span class="material-icons text-4xl">expand_more</span>
            </div>
          </div>
        </div>

        <!-- Technical HUD Borders (Futuristic) -->
        <ng-container *ngIf="page()?.theme === 'futuristic'">
           <div class="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 opacity-20" [style.border-color]="page()?.accent_color"></div>
           <div class="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 opacity-20" [style.border-color]="page()?.accent_color"></div>
           <div class="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 opacity-20" [style.border-color]="page()?.accent_color"></div>
           <div class="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 opacity-20" [style.border-color]="page()?.accent_color"></div>
        </ng-container>
      </section>

      <!-- Theme Specific Body Wrapper -->
      <div [ngClass]="{
        'bg-[#050505] text-white': page()?.theme === 'futuristic',
        'bg-white text-slate-900': page()?.theme !== 'futuristic'
      }">
        <!-- Gallery Section -->
        <section class="py-32 relative overflow-hidden" *ngIf="page()?.gallery?.length">
          <div class="container mx-auto px-6">
            <div class="mb-20 text-center">
               <h2 class="text-4xl md:text-6xl font-black mb-4 tracking-tighter"
                   [style.color]="page()?.theme === 'futuristic' ? page()?.accent_color : 'inherit'">
                   Nuestra Galería
               </h2>
               <div class="w-24 h-2 bg-primary mx-auto rounded-full" [style.background-color]="page()?.primary_color"></div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <p-card *ngFor="let img of page()?.gallery; let i = index" 
                    [styleClass]="'group relative overflow-hidden transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl'"
                    [style]="{'border-radius': '2rem', 'padding': '0', 'background': 'transparent', 'border': 'none', 'box-shadow': page()?.theme === 'futuristic' ? '0 0 30px ' + (page()?.accent_color || '#22c55e') + '22' : 'none'}">
                
                <div class="relative aspect-[4/5]">
                  <img [src]="img" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <p class="text-white font-bold uppercase tracking-widest text-sm">Proyecto {{ i + 1 }}</p>
                  </div>
                </div>
              </p-card>
            </div>
          </div>
        </section>

        <!-- Footer / Contact -->
        <footer class="py-24 border-t border-white/5" [ngClass]="{'bg-black': page()?.theme === 'futuristic', 'bg-slate-50': page()?.theme !== 'futuristic'}">
          <div class="container mx-auto px-6">
             <div class="flex flex-col md:flex-row justify-between items-center gap-12">
               <div>
                 <h3 class="text-2xl font-black mb-2">{{ page()?.slug }}</h3>
                 <p class="text-slate-500 text-sm">© 2026 Crafted with Passion. Powered by FestEasy.</p>
               </div>
               <div class="flex gap-8">
                  <a *ngIf="page()?.contact_email" [href]="'mailto:' + page()?.contact_email" 
                     class="text-xl font-bold hover:opacity-70 transition-opacity flex items-center gap-2">
                    <span class="material-icons opacity-40">mail</span>
                    {{ page()?.contact_email }}
                  </a>
               </div>
               <div class="flex gap-6">
                  <!-- Social Links iconified -->
                  <a *ngIf="page()?.instagram_url" [href]="page()?.instagram_url" target="_blank" class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                     <i class="pi pi-instagram"></i>
                  </a>
                  <a *ngIf="page()?.facebook_url" [href]="page()?.facebook_url" target="_blank" class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                     <i class="pi pi-facebook"></i>
                  </a>
               </div>
             </div>
          </div>
        </footer>
      </div>
    </div>

    <ng-template #loadingTemplate>
      <div class="min-h-screen flex items-center justify-center bg-slate-950">
        <div class="text-center relative">
          <div class="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-8"></div>
          <p class="text-white font-black tracking-widest uppercase animate-pulse">Iniciando Sistemas...</p>
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

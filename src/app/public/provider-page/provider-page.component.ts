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
    <div class="min-h-screen bg-[#050505] text-white selection:bg-primary/30" *ngIf="page()" 
         [style.--primary]="page()?.primary_color" [style.--accent]="page()?.accent_color">
      
      <!-- HERO: Impacto Total -->
      <section class="relative min-h-screen flex items-center overflow-hidden">
        <div class="absolute inset-0 z-0">
          <img [src]="page()?.hero_image || 'assets/images/default-hero.jpg'" 
               class="w-full h-full object-cover scale-110 animate-slow-zoom">
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#050505]"
               [style.background-color]="'rgba(0,0,0,' + (page()?.hero_overlay_opacity || 60) / 100 + ')'"></div>
          <!-- Resplandor de Acento -->
          <div class="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] blur-[150px] opacity-20 rounded-full"
               [style.background-color]="page()?.accent_color"></div>
        </div>

        <div class="container mx-auto px-6 relative z-10">
          <div class="max-w-5xl" [ngClass]="{'mx-auto text-center': page()?.hero_alignment === 'center', 'ml-auto text-right': page()?.hero_alignment === 'right'}">
            <span class="inline-block py-2 px-4 rounded-full border border-white/10 backdrop-blur-md mb-6 text-xs font-bold tracking-[0.3em] uppercase animate-fade-in"
                  [style.color]="page()?.accent_color">
              Experiencias Inolvidables
            </span>
            <h1 class="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.85] tracking-tighter animate-title-slide">
              {{ page()?.slogan || 'Creamos Momentos Mágicos' }}
            </h1>
            <p class="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl font-light leading-relaxed animate-fade-up"
               [ngClass]="{'mx-auto': page()?.hero_alignment === 'center', 'ml-auto': page()?.hero_alignment === 'right'}">
              {{ page()?.description }}
            </p>
            <div class="flex flex-wrap gap-4" [ngClass]="{'justify-center': page()?.hero_alignment === 'center', 'justify-end': page()?.hero_alignment === 'right'}">
              <a (click)="scrollTo('contacto')" class="cursor-pointer px-10 py-5 bg-white text-black rounded-full font-black text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                Cotizar Evento
              </a>
              <a [href]="'https://wa.me/' + page()?.contact_whatsapp" target="_blank" 
                 class="px-10 py-5 border border-white/20 rounded-full font-black text-lg backdrop-blur-md transition-all hover:bg-white/10">
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <!-- Decoración HUD -->
        <div class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30 animate-bounce">
          <span class="text-[10px] tracking-[0.5em] uppercase mb-4">Descubrir</span>
          <div class="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      <!-- SECCIÓN: BENEFICIOS (Cards Modernas) -->
      <section class="py-32 relative z-10" *ngIf="page()?.sections_config?.benefits?.length">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div *ngFor="let benefit of page()?.sections_config?.benefits" 
                 class="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:-translate-y-2">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 flex items-center justify-center mb-6 transition-transform group-hover:rotate-12"
                   [style.color]="page()?.accent_color">
                <i [class]="'pi pi-' + benefit.icon + ' text-3xl'"></i>
              </div>
              <h3 class="text-xl font-black mb-3">{{ benefit.title }}</h3>
              <p class="text-white/50 text-sm leading-relaxed">{{ benefit.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: SOBRE NOSOTROS (Asimétrico) -->
      <section class="py-32 relative overflow-hidden" *ngIf="page()?.sections_config?.about?.title">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div class="relative">
              <div class="aspect-[4/5] rounded-[3rem] overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700">
                <img [src]="page()?.sections_config?.about?.image_url || page()?.hero_image" class="w-full h-full object-cover">
              </div>
              <!-- Badge Experiencia -->
              <div class="absolute -bottom-10 -right-10 p-10 bg-white text-black rounded-[2.5rem] shadow-2xl animate-float">
                <div class="text-5xl font-black leading-none mb-1">{{ page()?.sections_config?.about?.experience_label }}</div>
                <div class="text-[10px] font-bold uppercase tracking-widest leading-tight opacity-50">
                  {{ page()?.sections_config?.about?.experience_text }}
                </div>
              </div>
            </div>
            <div class="space-y-8">
              <span class="text-xs font-black tracking-[0.4em] uppercase opacity-30">Nuestra Pasión</span>
              <h2 class="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
                {{ page()?.sections_config?.about?.title }}
              </h2>
              <p class="text-xl text-white/60 leading-relaxed font-light">
                {{ page()?.sections_config?.about?.description }}
              </p>
              <div class="pt-6">
                 <div class="flex items-center gap-6">
                    <div class="flex -space-x-4">
                      <div class="w-14 h-14 rounded-full border-4 border-[#050505] bg-slate-800"></div>
                      <div class="w-14 h-14 rounded-full border-4 border-[#050505] bg-slate-700"></div>
                      <div class="w-14 h-14 rounded-full border-4 border-[#050505] bg-slate-600"></div>
                    </div>
                    <div class="text-sm">
                      <div class="font-black">+500 Clientes Felices</div>
                      <div class="opacity-40">Confían en nosotros</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: PAQUETES (Pricing Premium) -->
      <section class="py-32 bg-white/2" *ngIf="livePackages().length || page()?.sections_config?.packages?.length">
        <div class="container mx-auto px-6">
          <div class="text-center mb-20">
            <h2 class="text-4xl md:text-6xl font-black mb-4 tracking-tighter">Nuestros Paquetes</h2>
            <p class="text-white/40 max-w-xl mx-auto font-light">Diseñados para adaptarse a tus necesidades y superar tus expectativas.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Usamos Live Packages si existen, si no los del config estático -->
            <div *ngFor="let pkg of (livePackages().length ? livePackages() : page()?.sections_config?.packages)" 
                 class="relative p-10 rounded-[3rem] border border-white/10 transition-all hover:border-white/30"
                 [ngClass]="{'bg-white text-black scale-105 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-10': pkg.is_popular, 'bg-white/5': !pkg.is_popular}">
              
              <div *ngIf="pkg.is_popular" class="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                Más Popular
              </div>

              <h4 class="text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-50">{{ pkg.title }}</h4>
              <div class="flex items-end gap-2 mb-8">
                <span class="text-5xl font-black">{{ pkg.currency === 'USD' ? '$' : '' }}{{ pkg.price }}</span>
                <span class="text-sm font-bold opacity-40 mb-2">{{ pkg.currency || 'MXN' }}</span>
              </div>
              
              <ul class="space-y-4 mb-10">
                <li *ngFor="let feat of pkg.features" class="flex items-center gap-3 text-sm opacity-80">
                  <i class="pi pi-check text-xs" [style.color]="pkg.is_popular ? '#000' : page()?.accent_color"></i>
                  {{ feat }}
                </li>
              </ul>

              <button class="w-full py-5 rounded-2xl font-black transition-all"
                      [style.background-color]="pkg.is_popular ? page()?.primary_color : 'transparent'"
                      [style.color]="pkg.is_popular ? 'white' : 'inherit'"
                      [class.border]="!pkg.is_popular" [class.border-white/20]="!pkg.is_popular">
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: GALERÍA (Masonry/Asimétrico) -->
      <section class="py-32" *ngIf="page()?.gallery?.length">
        <div class="container mx-auto px-6">
          <div class="flex justify-between items-end mb-16">
            <h2 class="text-5xl md:text-7xl font-black tracking-tighter">Galería</h2>
            <a class="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Ver todos</a>
          </div>
          <div class="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            <div *ngFor="let img of page()?.gallery; let i = index" 
                 class="relative group rounded-[2rem] overflow-hidden break-inside-avoid shadow-2xl">
              <img [src]="img" class="w-full object-cover transition-transform duration-1000 group-hover:scale-110">
              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                <p class="font-black text-xl mb-2">Momento {{ i + 1 }}</p>
                <div class="w-10 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: CONTACTO & FORM -->
      <section id="contacto" class="py-32 relative">
        <div class="container mx-auto px-6">
          <div class="bg-white/5 border border-white/10 rounded-[4rem] p-12 md:p-24 overflow-hidden relative">
            <!-- Glow background -->
            <div class="absolute top-0 right-0 w-96 h-96 blur-[120px] opacity-10 rounded-full"
                 [style.background-color]="page()?.primary_color"></div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div>
                <h2 class="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Hablemos de tu idea</h2>
                <p class="text-xl text-white/50 font-light mb-12">Estamos listos para hacer realidad tu próximo gran evento. Envíanos un mensaje y nos pondremos en contacto contigo lo antes posible.</p>
                
                <div class="space-y-6">
                   <div class="flex items-center gap-6">
                      <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <i class="pi pi-phone"></i>
                      </div>
                      <div>
                        <div class="text-xs uppercase font-black opacity-30">Llámanos</div>
                        <div class="text-lg font-bold">{{ page()?.contact_phone }}</div>
                      </div>
                   </div>
                   <div class="flex items-center gap-6">
                      <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <i class="pi pi-envelope"></i>
                      </div>
                      <div>
                        <div class="text-xs uppercase font-black opacity-30">Escríbenos</div>
                        <div class="text-lg font-bold">{{ page()?.contact_email }}</div>
                      </div>
                   </div>
                </div>
              </div>

              <!-- Contact Form Mockup -->
              <div class="space-y-4">
                 <input type="text" placeholder="Tu Nombre" class="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-white/30 focus:outline-none transition-all">
                 <input type="email" placeholder="Correo Electrónico" class="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-white/30 focus:outline-none transition-all">
                 <textarea rows="5" placeholder="Cuéntanos sobre tu evento" class="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-white/30 focus:outline-none transition-all"></textarea>
                 <button class="w-full py-6 rounded-2xl bg-white text-black font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                   Enviar Solicitud
                 </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer Minimalist -->
      <footer class="py-20 border-t border-white/5">
        <div class="container mx-auto px-6">
          <div class="flex flex-col md:flex-row justify-between items-center gap-10">
            <h3 class="text-2xl font-black tracking-tighter" [style.color]="page()?.accent_color">
              {{ page()?.slug?.toUpperCase() }}
            </h3>
            <div class="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
              © 2026 Powered by FestEasy • All Rights Reserved
            </div>
            <div class="flex gap-6">
               <a *ngIf="page()?.instagram_url" [href]="page()?.instagram_url" class="hover:text-primary transition-colors"><i class="pi pi-instagram"></i></a>
               <a *ngIf="page()?.facebook_url" [href]="page()?.facebook_url" class="hover:text-primary transition-colors"><i class="pi pi-facebook"></i></a>
               <a *ngIf="page()?.tiktok_url" [href]="page()?.tiktok_url" class="hover:text-primary transition-colors"><i class="pi pi-at"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>

    <div class="min-h-screen flex items-center justify-center bg-slate-950" *ngIf="!page() && !notFound()">
      <div class="text-center relative">
        <div class="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-8"></div>
        <p class="text-white font-black tracking-widest uppercase animate-pulse">Iniciando Sistemas...</p>
      </div>
    </div>

    <!-- Error state: Not Found -->
    <div class="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-center" *ngIf="notFound()">
      <div class="max-w-md animate-fade-in">
        <div class="w-32 h-32 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center mx-auto mb-10 rotate-12">
          <i class="pi pi-search text-5xl opacity-20"></i>
        </div>
        <h2 class="text-4xl font-black mb-6 tracking-tighter">Página no disponible</h2>
        <p class="text-white/50 font-light mb-12">No hemos podido encontrar la página que buscas. Es posible que el enlace sea incorrecto o el proveedor haya desactivado su sitio.</p>
        <a href="/" class="inline-block px-10 py-5 bg-white text-black rounded-full font-black text-lg transition-transform hover:scale-105 active:scale-95">
          Volver al Inicio
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes slow-zoom {
      from { transform: scale(1); }
      to { transform: scale(1.15); }
    }
    .animate-slow-zoom { animation: slow-zoom 30s infinite alternate linear; }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(2deg); }
      50% { transform: translateY(-20px) rotate(2deg); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }

    @keyframes title-slide {
      from { transform: translateY(50px); opacity: 0; filter: blur(10px); }
      to { transform: translateY(0); opacity: 1; filter: blur(0); }
    }
    .animate-title-slide { animation: title-slide 1.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
  `]
})
export class ProviderPublicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabaseData = inject(SupabaseDataService);

  page = signal<ProviderPublicPage | null>(null);
  notFound = signal(false);
  livePackages = signal<any[]>([]);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPage(slug);
    }
  }

  async loadPage(slug: string) {
    try {
      this.notFound.set(false);
      let data = await this.supabaseData.getProviderPublicPage(slug);
      
      // Caso 1: El slug buscado no coincide pero el de la DB está "limpio" y el buscado tiene espacios
      if (!data && slug !== slug.trim()) {
        data = await this.supabaseData.getProviderPublicPage(slug.trim());
      }

      // Caso 2: El slug buscado está "limpio" pero el de la DB tiene un espacio al final (caso reportado)
      if (!data) {
        data = await this.supabaseData.getProviderPublicPage(slug + ' ');
      }

      if (data) {
        this.page.set(data);
        // Cargar paquetes "en vivo" desde la base de datos
        this.loadLivePackages(data.provider_id);
      } else {
        this.notFound.set(true);
      }
    } catch (error) {
      console.error('Error loading public page:', error);
      this.notFound.set(true);
    }
  }

  async loadLivePackages(providerId: string) {
    try {
      this.supabaseData.getProviderPackages(providerId).subscribe(pkgs => {
        if (pkgs && pkgs.length > 0) {
          // Mapear al formato que espera el template (si es necesario)
          const mapped = pkgs.map(p => ({
            title: p.nombre_paquete || p.nombre,
            price: p.precio_base || p.precio,
            currency: 'MXN',
            features: Array.isArray(p.items_paquete) ? p.items_paquete.map((i: any) => i.nombre_item) : (p.descripcion ? [p.description || p.descripcion] : []),
            is_popular: p.destacado || false
          }));
          this.livePackages.set(mapped);
        }
      });
    } catch (error) {
      console.warn('No se pudieron cargar los paquetes en vivo:', error);
    }
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

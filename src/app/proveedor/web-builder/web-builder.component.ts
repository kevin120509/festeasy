import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ProviderPublicPage } from '../../models';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-web-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    RadioButtonModule,
    CardModule,
    ToastModule,
    FileUploadModule,
    ProgressSpinnerModule,
    ColorPickerModule,
    SelectModule,
    SliderModule,
    InputNumberModule
  ],
  providers: [MessageService],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <p-toast></p-toast>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-black text-slate-800">Constructor de Web</h1>
          <p class="text-slate-500">Personaliza tu página pública para atraer más clientes.</p>
        </div>
        <div class="flex gap-2">
           <p-button label="Ver Mi Página" icon="pi pi-external-link" severity="secondary" 
                     [disabled]="!page().slug" (onClick)="openLivePage()"></p-button>
           <p-button label="Guardar Cambios" icon="pi pi-save" [loading]="saving()" (onClick)="saveChanges()"></p-button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Editor Column -->
        <div class="space-y-6">
          <p-card header="Identidad de tu Página">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">URL Personalizada (Slug)</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon">festeasy.com/p/</span>
                  <input pInputText [(ngModel)]="page().slug" placeholder="mi-negocio-increible" />
                </div>
                <small class="text-slate-400">Usa minúsculas y guiones. Ej: eventos-fiesta</small>
              </div>

              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">Slogan Principal</label>
                <input pInputText [(ngModel)]="page().slogan" placeholder="Hacemos tus sueños realidad" />
              </div>

              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">Descripción Breve</label>
                <textarea pInputTextarea [(ngModel)]="page().description" rows="4" 
                          placeholder="Cuéntale a tus clientes por qué elegirte..."></textarea>
              </div>
            </div>
          </p-card>

          <p-card header="Diseño Hero">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">Tema Visual</label>
                <p-select [options]="themes" [(ngModel)]="page().theme" optionLabel="label" optionValue="value" 
                            placeholder="Selecciona un estilo" styleClass="w-full"></p-select>
              </div>

              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">Alineación del Texto</label>
                <div class="flex flex-wrap gap-4">
                  <div class="flex align-items-center">
                    <p-radioButton name="alignment" value="left" [(ngModel)]="page().hero_alignment" inputId="align1"></p-radioButton>
                    <label for="align1" class="ml-2">Izquierda</label>
                  </div>
                  <div class="flex align-items-center">
                    <p-radioButton name="alignment" value="center" [(ngModel)]="page().hero_alignment" inputId="align2"></p-radioButton>
                    <label for="align2" class="ml-2">Centro</label>
                  </div>
                  <div class="flex align-items-center">
                    <p-radioButton name="alignment" value="right" [(ngModel)]="page().hero_alignment" inputId="align3"></p-radioButton>
                    <label for="align3" class="ml-2">Derecha</label>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">Imagen de Fondo (Hero)</label>
                <div class="flex items-center gap-4">
                  <div class="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                    <img *ngIf="page().hero_image" [src]="page().hero_image" class="w-full h-full object-cover">
                    <div *ngIf="!page().hero_image" class="w-full h-full flex items-center justify-center text-slate-300">
                      <span class="material-icons-outlined text-3xl">image</span>
                    </div>
                  </div>
                  <div class="flex-grow">
                    <p-fileUpload mode="basic" chooseLabel="Cambiar Imagen" accept="image/*" 
                                [maxFileSize]="5000000" [auto]="true" (onSelect)="onHeroImageSelect($event)"
                                [disabled]="uploadingHero()"></p-fileUpload>
                    <p class="text-[10px] text-slate-400 mt-2">Máximo 5MB. Formatos: JPG, PNG, WEBP.</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div class="flex items-center justify-between">
                      <label class="font-bold text-xs uppercase tracking-wider text-slate-500">Color Primario</label>
                      <p-colorPicker [(ngModel)]="page().primary_color"></p-colorPicker>
                  </div>
                  <div class="flex items-center justify-between">
                      <label class="font-bold text-xs uppercase tracking-wider text-slate-500">Color de Acento</label>
                      <p-colorPicker [(ngModel)]="page().accent_color"></p-colorPicker>
                  </div>
                  <div class="flex flex-col gap-2">
                      <div class="flex justify-between items-center">
                        <label class="font-bold text-xs uppercase tracking-wider text-slate-500">Opacidad Overlay</label>
                        <span class="text-xs font-bold">{{ page().hero_overlay_opacity || 0 }}%</span>
                      </div>
                      <p-slider [(ngModel)]="page().hero_overlay_opacity" [min]="0" [max]="100" class="w-full"></p-slider>
                  </div>
              </div>
            </div>
          </p-card>

          <p-card header="Galería de Fotos">
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-4 gap-2">
                <div *ngFor="let img of page().gallery; let i = index" class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                  <img [src]="img" class="w-full h-full object-cover">
                  <button (click)="removeGalleryImage(i)" 
                          class="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-icons-outlined text-xs">close</span>
                  </button>
                </div>
                <div *ngIf="uploadingGallery()" class="aspect-square rounded-lg border border-dashed border-primary flex items-center justify-center bg-primary/5">
                  <p-progressSpinner styleClass="w-8 h-8" strokeWidth="4"></p-progressSpinner>
                </div>
              </div>
              <p-fileUpload mode="basic" chooseLabel="Añadir a la Galería" name="gallery[]" 
                          accept="image/*" [maxFileSize]="5000000" [auto]="true" [multiple]="true"
                          (onSelect)="onGallerySelect($event)" [disabled]="uploadingGallery()"></p-fileUpload>
            </div>
          </p-card>

          <p-card header="Redes Sociales">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-xs">Instagram</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon"><i class="pi pi-instagram"></i></span>
                  <input pInputText [(ngModel)]="page().instagram_url" placeholder="https://instagram.com/tu-negocio" />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-xs">Facebook</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon"><i class="pi pi-facebook"></i></span>
                  <input pInputText [(ngModel)]="page().facebook_url" placeholder="https://facebook.com/tu-negocio" />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-xs">TikTok</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon"><i class="pi pi-at"></i></span>
                  <input pInputText [(ngModel)]="page().tiktok_url" placeholder="https://tiktok.com/@tu-negocio" />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-xs">Twitter / X</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon"><i class="pi pi-twitter"></i></span>
                  <input pInputText [(ngModel)]="page().twitter_url" placeholder="https://twitter.com/tu-negocio" />
                </div>
              </div>
            </div>
          </p-card>

          <p-card header="Contacto Directo">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-xs">Teléfono</label>
                <input pInputText [(ngModel)]="page().contact_phone" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm text-xs">WhatsApp (Sin +)</label>
                <input pInputText [(ngModel)]="page().contact_whatsapp" />
              </div>
              <div class="flex flex-col gap-2 sm:col-span-2">
                <label class="font-bold text-sm text-xs">Email Público</label>
                <input pInputText [(ngModel)]="page().contact_email" />
              </div>
            </div>
          </p-card>
        </div>

        <!-- Preview Column -->
        <div class="hidden md:block sticky top-6">
          <div class="border-4 border-slate-200 rounded-3xl overflow-hidden shadow-2xl scale-[0.8] origin-top">
            <div class="bg-white h-[800px] overflow-y-auto overflow-x-hidden">
               <!-- Mockup of the public page -->
               <section class="relative h-64 flex items-center p-6 bg-slate-900 overflow-hidden"
                        [ngClass]="{
                          'justify-start text-left': page().hero_alignment === 'left',
                          'justify-center text-center': page().hero_alignment === 'center',
                          'justify-end text-right': page().hero_alignment === 'right'
                        }">
                  <!-- Background Image -->
                  <img *ngIf="page().hero_image" [src]="page().hero_image" class="absolute inset-0 w-full h-full object-cover z-0">
                  
                  <!-- Overlay -->
                  <div class="absolute inset-0 z-10" 
                       [style.background-color]="'rgba(0,0,0,' + (page().hero_overlay_opacity || 40) / 100 + ')'"></div>

                  <!-- Futuristic Glow (if theme is futuristic) -->
                  <div *ngIf="page().theme === 'futuristic'" 
                       class="absolute inset-0 z-10"
                       [style.box-shadow]="'inset 0 0 100px ' + (page().accent_color || '#22c55e')"></div>

                  <div class="relative z-20 w-full">
                    <h2 class="text-2xl font-black mb-2 text-white" 
                        [style.color]="page().theme === 'futuristic' ? 'white' : 'inherit'">
                        {{ page().slogan || 'Tu Slogan Aquí' }}
                    </h2>
                    <p class="text-xs line-clamp-3 text-slate-200">
                        {{ page().description || 'Descripción de tu negocio...' }}
                    </p>
                    
                    <!-- Action Buttons Mockup -->
                    <div class="flex gap-2 mt-4" 
                         [ngClass]="{'justify-start': page().hero_alignment === 'left', 'justify-center': page().hero_alignment === 'center', 'justify-end': page().hero_alignment === 'right'}">
                         <button class="px-4 py-2 rounded-lg text-[10px] font-bold text-white shadow-lg"
                                 [style.background-color]="page().primary_color || '#ef4444'">
                            Llamar ahora
                         </button>
                         <button class="px-4 py-2 rounded-lg text-[10px] font-bold text-white shadow-lg"
                                 [style.background-color]="page().accent_color || '#22c55e'">
                            WhatsApp
                         </button>
                    </div>

                    <!-- Social Icons Mockup -->
                    <div class="flex gap-2 mt-4 opacity-70" 
                         [ngClass]="{'justify-start': page().hero_alignment === 'left', 'justify-center': page().hero_alignment === 'center', 'justify-end': page().hero_alignment === 'right'}">
                      <i *ngIf="page().instagram_url" class="pi pi-instagram text-white text-xs"></i>
                      <i *ngIf="page().facebook_url" class="pi pi-facebook text-white text-xs"></i>
                      <i *ngIf="page().tiktok_url" class="pi pi-at text-white text-xs"></i>
                      <i *ngIf="page().twitter_url" class="pi pi-twitter text-white text-xs"></i>
                    </div>
                  </div>
               </section>
               <div class="p-6">
                  <div class="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="h-24 bg-slate-100 rounded-xl"></div>
                    <div class="h-24 bg-slate-100 rounded-xl"></div>
                  </div>
                  
                  <div class="mt-8 pt-8 border-t border-slate-100">
                    <div class="flex items-center gap-2 mb-4">
                       <i class="pi pi-phone text-xs"></i>
                       <span class="text-[10px]">{{ page().contact_phone || 'Teléfono' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                       <i class="pi pi-envelope text-xs"></i>
                       <span class="text-[10px]">{{ page().contact_email || 'Email' }}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
          <p class="text-center text-slate-400 text-xs mt-2 italic font-medium">Previsualización en tiempo real (Escritorio)</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #fafafa; min-height: 100vh; }
  `]
})
export class WebBuilderComponent implements OnInit {
  private supabaseData = inject(SupabaseDataService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  page = signal<Partial<ProviderPublicPage>>({
    hero_alignment: 'center',
    is_active: true,
    gallery: []
  });

  loading = signal(true);
  saving = signal(false);
  uploadingHero = signal(false);
  uploadingGallery = signal(false);

  themes = [
    { label: '💎 Elegante y Moderno', value: 'modern' },
    { label: '🚀 HUD / Futurista', value: 'futuristic' },
    { label: '🎨 Minimalista', value: 'minimal' }
  ];

  ngOnInit() {
    this.loadPageData();
  }

  async loadPageData() {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const data = await this.supabaseData.getProviderPublicPageByProviderId(user.id);
      if (data) {
        this.page.set({
          ...data,
          primary_color: data.primary_color || '#ef4444',
          accent_color: data.accent_color || '#22c55e',
          hero_overlay_opacity: data.hero_overlay_opacity ?? 40,
          theme: data.theme || 'modern'
        });
      } else {
        // Inicializar con datos del perfil
        this.page.set({
          provider_id: user.id,
          hero_alignment: 'center',
          hero_image: user.avatar_url, // Pre-cargar avatar como imagen hero por defecto
          is_active: true,
          slug: user.nombre_negocio?.toLowerCase().replace(/\s+/g, '-') || '',
          slogan: '¡Bienvenidos a ' + (user.nombre_negocio || 'nuestro negocio') + '!',
          description: user.description || user.descripcion,
          contact_phone: user.telefono,
          contact_email: user.correo_electronico,
          gallery: [],
          primary_color: '#ef4444',
          accent_color: '#22c55e',
          hero_overlay_opacity: 40,
          theme: 'modern'
        });
      }
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async saveChanges() {
    this.saving.set(true);
    try {
      // Clean up metadata from page if any
      const dataToSave = { ...this.page() };
      const updated = await this.supabaseData.upsertProviderPublicPage(dataToSave);
      this.page.set(updated);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Página actualizada correctamente'
      });
    } catch (error: any) {
      console.error('Error saving page:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo guardar los cambios'
      });
    } finally {
      this.saving.set(false);
    }
  }

  async onHeroImageSelect(event: any) {
    const file = event.files[0];
    if (!file) return;

    this.uploadingHero.set(true);
    try {
      const user = this.authService.currentUser();
      const path = `heroes/${user?.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const url = await this.supabaseService.uploadFile('sitio_web', path, file);
      this.page.update(p => ({ ...p, hero_image: url }));
    } catch (error) {
      console.error('Error uploading hero image:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la imagen' });
    } finally {
      this.uploadingHero.set(false);
    }
  }

  async onGallerySelect(event: any) {
    const files = event.files;
    if (!files?.length) return;

    this.uploadingGallery.set(true);
    try {
      const user = this.authService.currentUser();
      for (const file of files) {
        const path = `gallery/${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        const url = await this.supabaseService.uploadFile('sitio_web', path, file);
        this.page.update(p => ({
          ...p,
          gallery: [...(p.gallery || []), url]
        }));
      }
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron subir algunas imágenes' });
    } finally {
      this.uploadingGallery.set(false);
    }
  }

  removeGalleryImage(index: number) {
    this.page.update(p => ({
      ...p,
      gallery: p.gallery?.filter((_: any, i: number) => i !== index)
    }));
  }

  openLivePage() {
    if (this.page().slug) {
      window.open(`/p/${this.page().slug}`, '_blank');
    }
  }
}

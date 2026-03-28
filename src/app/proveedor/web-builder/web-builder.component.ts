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
import { CheckboxModule } from 'primeng/checkbox';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { Checkbox } from 'primeng/checkbox';

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
    InputNumberModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    Checkbox
  ],
  providers: [MessageService],
  template: `
    <div class="p-4 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      <p-toast></p-toast>
      
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-slate-200/60">
        <div>
          <h1 class="text-4xl font-black text-slate-800 tracking-tight">Constructor de Web</h1>
          <p class="text-slate-500 mt-1">Configura tu presencia digital premium en segundos.</p>
        </div>
        <div class="flex items-center gap-3">
           <p-button label="Vista Previa" icon="pi pi-external-link" [text]="true" severity="secondary" 
                     [disabled]="!page().slug" (onClick)="openLivePage()"></p-button>
           <p-button label="Guardar Cambios" icon="pi pi-check-circle" 
                     class="p-button-rounded shadow-lg"
                     [loading]="saving()" (onClick)="saveChanges()"></p-button>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <!-- Editor Column: 7/12 -->
        <div class="xl:col-span-7 space-y-8">
          
          <!-- Secciones en Acordeón Estilizado -->
          <div class="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div class="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 class="font-black text-slate-700 uppercase tracking-widest text-xs">Módulos de Contenido</h2>
              <span class="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                EDITOR ACTIVO
              </span>
            </div>

            <p-accordion [multiple]="true" [value]="['0']" class="custom-builder-accordion">
              <!-- SECCIÓN 1: IDENTIDAD -->
              <p-accordion-panel value="0">
                <p-accordion-header>
                  <div class="flex align-items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <i class="pi pi-id-card"></i>
                    </div>
                    <div>
                      <span class="font-black text-sm block">Identidad y Hero</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-tighter">Slogan, Colores y Enlace</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="flex flex-col gap-6 py-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="flex flex-col gap-2">
                        <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest">Slug de la URL</label>
                        <div class="p-inputgroup modern-group">
                          <span class="p-inputgroup-addon bg-slate-50 border-slate-200 text-[10px]">festeasy.com/p/</span>
                          <input pInputText [(ngModel)]="page().slug" placeholder="mi-negocio" class="text-sm border-slate-200" />
                        </div>
                      </div>
                      <div class="flex flex-col gap-2">
                        <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest">Slogan Principal</label>
                        <input pInputText [(ngModel)]="page().slogan" placeholder="Título impactante" class="text-sm border-slate-200 rounded-xl" />
                      </div>
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest">Presentación Corta</label>
                      <textarea pInputTextarea [(ngModel)]="page().description" rows="3" 
                                class="text-sm border-slate-200 rounded-xl resize-none"
                                placeholder="Describe brevemente lo que ofreces..."></textarea>
                    </div>

                    <div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                      <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest block mb-4">Identidad Visual (Marca)</label>
                      <div class="flex flex-wrap items-center gap-10">
                        <div class="flex items-center gap-3">
                          <p-colorPicker [(ngModel)]="page().primary_color"></p-colorPicker>
                          <div>
                            <span class="text-xs font-bold block">Color Primario</span>
                            <span class="text-[10px] text-slate-400 uppercase">Botones y Fondos</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <p-colorPicker [(ngModel)]="page().accent_color"></p-colorPicker>
                          <div>
                            <span class="text-xs font-bold block">Color de Acento</span>
                            <span class="text-[10px] text-slate-400 uppercase">Detalles y Brillos</span>
                          </div>
                        </div>
                        <div class="flex-grow">
                           <label class="text-[10px] font-bold text-slate-400 block mb-1">Imagen Hero (Portada)</label>
                           <p-fileUpload mode="basic" chooseLabel="Cambiar Portada" 
                                         class="p-button-sm"
                                         accept="image/*" (onSelect)="onHeroImageSelect($event)"></p-fileUpload>
                        </div>
                      </div>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- SECCIÓN 2: SOBRE NOSOTROS -->
              <p-accordion-panel value="1">
                <p-accordion-header>
                  <div class="flex align-items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
                      <i class="pi pi-heart"></i>
                    </div>
                    <div>
                      <span class="font-black text-sm block">Sobre Nosotros</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-tighter">Historia y Experiencia</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="flex flex-col gap-6 py-4" *ngIf="page().sections_config?.about">
                    <div class="flex flex-col gap-2">
                       <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest">Título de Sección</label>
                       <input pInputText [(ngModel)]="page().sections_config.about.title" class="rounded-xl border-slate-200" />
                    </div>
                    <div class="flex flex-col gap-2">
                       <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest">Historia o Misión</label>
                       <textarea pInputTextarea [(ngModel)]="page().sections_config.about.description" rows="5" 
                                 class="text-sm border-slate-200 rounded-xl resize-none"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest block mb-2">Valor Experiencia</label>
                        <input pInputText [(ngModel)]="page().sections_config.about.experience_label" placeholder="Ej: 10+" class="w-full" />
                      </div>
                      <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label class="font-black text-[10px] uppercase text-slate-400 tracking-widest block mb-2">Etiqueta</label>
                        <input pInputText [(ngModel)]="page().sections_config.about.experience_text" placeholder="Años en el sector" class="w-full" />
                      </div>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- SECCIÓN 3: BENEFICIOS -->
              <p-accordion-panel value="2">
                <p-accordion-header>
                  <div class="flex align-items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                      <i class="pi pi-star"></i>
                    </div>
                    <div>
                      <span class="font-black text-sm block">Beneficios y Valores</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-tighter">Lo que te hace único</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="space-y-4 py-4" *ngIf="page().sections_config?.benefits">
                    <div *ngFor="let b of page().sections_config.benefits; let i = index" 
                         class="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all relative">
                      <button (click)="removeBenefit(i)" class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center">
                        <i class="pi pi-times text-[10px]"></i>
                      </button>
                      <div class="flex gap-4">
                        <div class="flex flex-col gap-2">
                           <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icono</label>
                           <input pInputText [(ngModel)]="b.icon" class="text-xs w-24 rounded-lg" placeholder="star" />
                           <div class="text-[9px] text-slate-400 text-center">pi-{{b.icon}}</div>
                        </div>
                        <div class="flex-grow flex flex-col gap-4">
                           <div class="flex flex-col gap-1">
                             <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                             <input pInputText [(ngModel)]="b.title" class="font-bold text-sm bg-transparent border-0 border-b border-slate-200 focus:border-primary rounded-none p-1" />
                           </div>
                           <div class="flex flex-col gap-1">
                             <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción corta</label>
                             <input pInputText [(ngModel)]="b.description" class="text-xs bg-transparent border-0 border-b border-slate-100 rounded-none p-1" />
                           </div>
                        </div>
                      </div>
                    </div>
                    <button (click)="addBenefit()" class="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      <i class="pi pi-plus-circle"></i>
                      Añadir Nuevo Beneficio
                    </button>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- SECCIÓN 4: PAQUETES -->
              <p-accordion-panel value="3">
                <p-accordion-header>
                  <div class="flex align-items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <i class="pi pi-tags"></i>
                    </div>
                    <div>
                      <span class="font-black text-sm block">Paquetes Destacados</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-tighter">Oferta comercial</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="space-y-6 py-4" *ngIf="page().sections_config?.packages">
                    <div *ngFor="let pkg of page().sections_config.packages; let i = index" 
                         class="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-2">
                           <p-checkbox [(ngModel)]="pkg.is_popular" [binary]="true" inputId="pop-{{i}}"></p-checkbox>
                           <label [for]="'pop-'+i" class="text-xs font-black uppercase tracking-widest" [class.text-primary]="pkg.is_popular">
                             {{ pkg.is_popular ? 'Destacado ⭐' : 'Plan Normal' }}
                           </label>
                        </div>
                        <button (click)="removePackage(i)" class="text-slate-400 hover:text-slate-900"><i class="pi pi-trash"></i></button>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="flex flex-col gap-2">
                           <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Paquete</label>
                           <input pInputText [(ngModel)]="pkg.title" class="font-black rounded-xl" />
                        </div>
                        <div class="flex flex-col gap-2">
                           <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Base</label>
                           <div class="p-inputgroup">
                              <span class="p-inputgroup-addon bg-slate-50">$</span>
                              <input pInputText [(ngModel)]="pkg.price" class="font-black" />
                              <span class="p-inputgroup-addon bg-slate-50">MXN</span>
                           </div>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Inclusiones y Servicios</label>
                        <div *ngFor="let feat of pkg.features; let fi = index; trackBy: trackByFn" class="flex gap-2 items-center">
                           <input pInputText [(ngModel)]="pkg.features[fi]" class="text-xs bg-slate-50 border-transparent rounded-lg p-2 flex-grow focus:bg-white focus:border-primary" />
                           <button (click)="removeFeature(i, fi)" class="text-slate-300 hover:text-slate-900"><i class="pi pi-minus-circle"></i></button>
                        </div>
                        <button (click)="addFeature(i)" class="text-primary text-[10px] font-black uppercase tracking-widest mt-2 hover:opacity-70">
                          + Añadir Característica
                        </button>
                      </div>
                    </div>
                    <button (click)="addPackage()" class="w-full py-4 rounded-3xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all">
                      Añadir Nuevo Paquete de Servicio
                    </button>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- SECCIÓN 5: GALERÍA DE FOTOS -->
              <p-accordion-panel value="4">
                <p-accordion-header>
                  <div class="flex align-items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                      <i class="pi pi-images"></i>
                    </div>
                    <div>
                      <span class="font-black text-sm block">Galería de Referencia</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-tighter">Fotos de tus trabajos</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="space-y-6 py-4">
                    <div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                       <i class="pi pi-cloud-upload text-3xl text-slate-300 mb-2"></i>
                       <p class="text-xs font-bold text-slate-500 mb-4">Sube fotos reales de tus eventos para generar confianza.</p>
                       <p-fileUpload mode="basic" chooseLabel="Añadir Fotos a la Galería" 
                                     [multiple]="true" accept="image/*" 
                                     [customUpload]="true" (onSelect)="onGallerySelect($event)"></p-fileUpload>
                    </div>

                    <div class="grid grid-cols-2 p-2 gap-4" *ngIf="page().gallery?.length">
                       <div *ngFor="let img of page().gallery; let i = index" class="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                          <img [src]="img" class="w-full h-full object-cover">
                          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button (click)="removeGalleryImage(i)" class="w-8 h-8 rounded-full bg-white text-red-500 shadow-lg flex items-center justify-center">
                                <i class="pi pi-trash"></i>
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- SECCIÓN 6: REDES SOCIALES -->
              <p-accordion-panel value="5">
                <p-accordion-header>
                  <div class="flex align-items-center gap-3 py-1">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                      <i class="pi pi-share-alt"></i>
                    </div>
                    <div>
                      <span class="font-black text-sm block">Redes Sociales</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-tighter">Canales de contacto</span>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div class="p-inputgroup modern-group">
                      <span class="p-inputgroup-addon"><i class="pi pi-whatsapp"></i></span>
                      <input pInputText [(ngModel)]="page().contact_whatsapp" placeholder="WhatsApp" class="text-sm" />
                    </div>
                    <div class="p-inputgroup modern-group">
                      <span class="p-inputgroup-addon"><i class="pi pi-instagram"></i></span>
                      <input pInputText [(ngModel)]="page().instagram_url" placeholder="URL Instagram" class="text-sm" />
                    </div>
                    <div class="p-inputgroup modern-group">
                      <span class="p-inputgroup-addon"><i class="pi pi-facebook"></i></span>
                      <input pInputText [(ngModel)]="page().facebook_url" placeholder="URL Facebook" class="text-sm" />
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            </p-accordion>
          </div>
        </div>

        <!-- Preview Column: 5/12 -->
        <div class="xl:col-span-5 relative">
          <div class="sticky top-10 flex flex-col items-center">
            
            <!-- PHONE MOCKUP -->
            <div class="phone-mockup relative mx-auto w-[320px] h-[650px] bg-[#1a1a1a] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-[#2a2a2a]">
              <!-- Notch -->
              <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2a2a2a] rounded-b-2xl z-50"></div>
              <!-- Side Buttons Decor -->
              <div class="absolute -left-[10px] top-24 w-[2px] h-12 bg-[#333] rounded-l"></div>
              <div class="absolute -right-[10px] top-32 w-[2px] h-16 bg-[#333] rounded-r"></div>

              <!-- Content Container -->
              <div class="w-full h-full rounded-[2.8rem] overflow-y-auto bg-[#050505] relative preview-scroll scrollbar-hide">
                
                <!-- MINI PREVIEW DE PÁGINA PÚBLICA -->
                <div class="preview-content-zoom" [style.--accent]="page().accent_color || '#906BBD'">
                  <!-- Hero Preview -->
                  <div class="relative h-[400px] bg-slate-900 flex items-center px-8 overflow-hidden">
                     <img *ngIf="page().hero_image" [src]="page().hero_image" class="absolute inset-0 w-full h-full object-cover opacity-60">
                     <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505]"></div>
                     
                     <div class="relative z-10 w-full" 
                          [ngClass]="{'text-center': page().hero_alignment === 'center', 'text-right': page().hero_alignment === 'right'}">
                        <div class="w-10 h-1 bg-primary mb-6 animate-pulse" [style.background-color]="page().accent_color"></div>
                        <h2 class="text-4xl font-black text-white leading-[0.9] mb-4 tracking-tighter">
                          {{ page().slogan || 'TU SLOGAN AQUÍ' }}
                        </h2>
                        <p class="text-xs text-white/60 mb-8 line-clamp-3 leading-relaxed">
                          {{ page().description || 'Descripción breve de tu negocio...' }}
                        </p>
                        <div class="flex gap-3" [ngClass]="{'justify-center': page().hero_alignment === 'center', 'justify-end': page().hero_alignment === 'right'}">
                          <div class="px-6 py-3 rounded-xl bg-white text-black text-[10px] font-black">COTIZAR</div>
                          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white border border-white/20">
                             <i class="pi pi-whatsapp"></i>
                          </div>
                        </div>
                     </div>
                  </div>

                  <!-- Benefits Preview -->
                  <div class="p-8 space-y-4">
                     <div class="grid grid-cols-2 gap-3">
                        <div *ngFor="let b of page().sections_config?.benefits" class="p-4 rounded-2xl bg-white/5 border border-white/10">
                           <i [class]="'pi pi-' + (b.icon || 'star') + ' text-xs mb-2'" [style.color]="page().accent_color"></i>
                           <div class="text-[9px] font-black uppercase text-white mb-1">{{ b.title }}</div>
                           <div class="text-[8px] text-white/40 line-clamp-2 leading-tight">{{ b.description }}</div>
                        </div>
                     </div>
                  </div>

                  <!-- About Preview -->
                  <div class="p-8 bg-white/2 flex gap-6 items-center">
                     <div class="w-1/3 aspect-[4/5] rounded-2xl bg-slate-800 overflow-hidden relative border border-white/10">
                        <img *ngIf="page().sections_config?.about?.image_url" [src]="page().sections_config.about.image_url" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-primary/20"></div>
                     </div>
                     <div class="w-2/3">
                        <div class="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-2" [style.color]="page().accent_color">Nuestra Pasión</div>
                        <div class="text-lg font-black text-white leading-tight mb-2">{{ page().sections_config?.about?.title }}</div>
                        <div class="text-[9px] text-white/50 line-clamp-4 leading-relaxed">{{ page().sections_config?.about?.description }}</div>
                     </div>
                  </div>

                  <!-- Gallery Preview -->
                  <div class="p-8" *ngIf="page().gallery?.length">
                     <div class="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-4" [style.color]="page().accent_color">Nuestro Trabajo</div>
                     <div class="grid grid-cols-2 gap-2">
                        <div *ngFor="let img of page().gallery" class="aspect-square rounded-xl bg-slate-800 overflow-hidden border border-white/5">
                           <img [src]="img" class="w-full h-full object-cover">
                        </div>
                     </div>
                  </div>

                  <!-- Packages Preview -->
                  <div class="p-8 space-y-4" *ngIf="page().sections_config?.packages?.length">
                    <div *ngFor="let pkg of page().sections_config.packages" class="p-6 rounded-3xl border border-white/10 bg-white/5 relative overflow-hidden"
                         [style.border-color]="pkg.is_popular ? page().accent_color + '44' : 'rgba(255,255,255,0.1)'">
                       <div *ngIf="pkg.is_popular" class="absolute top-0 right-0 px-3 py-1 bg-primary text-[8px] font-black text-white rounded-bl-xl" [style.background-color]="page().accent_color">TOP SELL</div>
                       <div class="text-lg font-black text-white mb-1">{{ pkg.title }}</div>
                       <div class="text-base font-black text-primary mb-4" [style.color]="page().accent_color">{{ '$' }}{{ pkg.price }}</div>
                       <div class="space-y-2">
                          <div *ngFor="let f of pkg.features" class="flex items-center gap-2 text-[8px] text-white/50">
                             <i class="pi pi-check text-primary" [style.color]="page().accent_color"></i>
                             <span>{{ f }}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <!-- Footer Preview -->
                  <div class="p-8 border-t border-white/5 text-center">
                     <div class="text-xs font-black text-white mb-2">{{ page().slug?.toUpperCase() || 'MI NEGOCIO' }}</div>
                     <div class="flex justify-center gap-4 opacity-30 scale-75">
                         <i class="pi pi-instagram"></i>
                         <i class="pi pi-facebook"></i>
                         <i class="pi pi-whatsapp"></i>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8 text-center space-y-2">
              <span class="px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black tracking-widest uppercase">Vista Previa Móvil</span>
              <p class="text-slate-400 text-xs italic">Sincronización en tiempo real</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #fafafa; min-height: 100vh; font-family: 'Inter', sans-serif; }
    
    .preview-scroll { cursor: default; }
    .preview-scroll::-webkit-scrollbar { display: none; }
    
    ::ng-deep .custom-builder-accordion .p-accordion-header {
      background: #fff;
      border: 0;
      border-bottom: 1px solid #f1f5f9;
      padding: 1.25rem 1.5rem;
      transition: all 0.2s ease;
    }
    
    ::ng-deep .custom-builder-accordion .p-accordion-header:hover {
      background: #f8fafc;
    }
    
    ::ng-deep .custom-builder-accordion .p-accordion-header[aria-expanded="true"] {
      background: #f8fafc;
    }

    ::ng-deep .custom-builder-accordion .p-accordion-content {
      background: #fff;
      border: 0;
      padding: 0 1.5rem 1.5rem 1.5rem;
    }

    .modern-group .p-inputgroup-addon {
      border-right: 0;
      font-weight: 800;
    }

    .phone-mockup {
      transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.1);
    }
    
    .phone-mockup:hover {
      transform: translateY(-5px);
    }

    .preview-content-zoom {
      /* Aquí no escalamos con transform para evitar borrosidad en texto pequeño, 
         usamos dimensiones nativas pequeñas */
    }

    /* Animaciones */
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.6s ease-out; }
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

  trackByFn(index: number, item: any) {
    return index;
  }

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
          primary_color: data.primary_color || '#523576',
          accent_color: data.accent_color || '#906BBD',
          hero_overlay_opacity: data.hero_overlay_opacity ?? 40,
          theme: data.theme || 'modern',
          sections_config: data.sections_config || this.getDefaultSections()
        });
      } else {
        // Inicializar con datos del perfil
        this.page.set({
          provider_id: user.id,
          hero_alignment: 'center',
          hero_image: user.avatar_url,
          is_active: true,
          slug: user.nombre_negocio?.toLowerCase().replace(/\s+/g, '-') || '',
          slogan: '¡Bienvenidos a ' + (user.nombre_negocio || 'nuestro negocio') + '!',
          description: user.description || user.descripcion,
          contact_phone: user.telefono,
          contact_email: user.correo_electronico,
          gallery: [],
          primary_color: '#523576',
          accent_color: '#906BBD',
          hero_overlay_opacity: 40,
          theme: 'modern',
          sections_config: this.getDefaultSections()
        });
      }
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getDefaultSections() {
    return {
      about: {
        title: 'Nuestra Historia',
        description: '',
        image_url: '',
        experience_label: '12+',
        experience_text: 'Años de Experiencia'
      },
      benefits: [
        { icon: 'lock', title: 'Soluciones 100% personalizadas', description: 'Creamos a medida para cada tipo de evento.' },
        { icon: 'person', title: 'Trato directo y cercano', description: 'Soporte y atención personalizada 24/7.' },
        { icon: 'speed', title: 'Fácil de usar', description: 'Reserva y gestiona en segundos.' },
        { icon: 'credit_card', title: 'Sin rentas mensuales', description: 'Transparencia total en cada contrato.' }
      ],
      packages: [
        { title: 'Básico', price: '1200', currency: 'MXN', features: ['Característica 1', 'Característica 2'], is_popular: false },
        { title: 'Estándar', price: '2500', currency: 'MXN', features: ['Todo lo del básico', 'Característica extra'], is_popular: true },
        { title: 'Premium', price: '4500', currency: 'MXN', features: ['Servicio VIP', 'Atención prioritaria'], is_popular: false }
      ]
    };
  }

  addBenefit() {
    const config = this.page().sections_config || this.getDefaultSections();
    config.benefits.push({ icon: 'star', title: 'Nuevo Beneficio', description: '' });
    this.page.update(p => ({ ...p, sections_config: { ...config } }));
  }

  removeBenefit(index: number) {
    const config = this.page().sections_config;
    config.benefits.splice(index, 1);
    this.page.update(p => ({ ...p, sections_config: { ...config } }));
  }

  addPackage() {
    const config = this.page().sections_config || this.getDefaultSections();
    config.packages.push({ title: 'Nuevo Paquete', price: '0', currency: 'MXN', features: [], is_popular: false });
    this.page.update(p => ({ ...p, sections_config: { ...config } }));
  }

  removePackage(index: number) {
    const config = this.page().sections_config;
    config.packages.splice(index, 1);
    this.page.update(p => ({ ...p, sections_config: { ...config } }));
  }

  addFeature(pkgIndex: number) {
    const config = this.page().sections_config;
    config.packages[pkgIndex].features.push('Nueva característica');
    this.page.update(p => ({ ...p, sections_config: { ...config } }));
  }

  removeFeature(pkgIndex: number, featIndex: number) {
    const config = this.page().sections_config;
    config.packages[pkgIndex].features.splice(featIndex, 1);
    this.page.update(p => ({ ...p, sections_config: { ...config } }));
  }

  async onAboutImageSelect(event: any) {
    const file = event.files[0];
    if (!file) return;
    this.uploadingHero.set(true);
    try {
      const user = this.authService.currentUser();
      const path = `about/${user?.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const url = await this.supabaseService.uploadFile('sitio_web', path, file);
      const config = this.page().sections_config || this.getDefaultSections();
      config.about.image_url = url;
      this.page.update(p => ({ ...p, sections_config: { ...config } }));
    } catch (error) {
      console.error('About image upload error:', error);
    } finally {
      this.uploadingHero.set(false);
    }
  }

  async saveChanges() {
    this.saving.set(true);
    try {
      // Clean up metadata from page if any
      const dataToSave = { ...this.page() };
      
      // Normalizar slug (quitar espacios y asegurar formato URL)
      if (dataToSave.slug) {
        dataToSave.slug = dataToSave.slug.trim().toLowerCase().replace(/\s+/g, '-');
      }

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

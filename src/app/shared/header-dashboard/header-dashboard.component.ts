import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <!-- Menú hamburguesa (Móvil) -->
        <button (click)="onMenuToggle.emit()" class="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center">
          <span class="material-icons-outlined">menu</span>
        </button>

        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-2">
          <img src="assets/festeasy.png" alt="FESTEASY" class="h-8 w-auto object-contain">
        </a>
      </div>

      <!-- Perfil Usuario (alineado a la derecha) -->
      <div class="flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <p class="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            {{ auth.currentUser()?.nombre_negocio || auth.currentUser()?.nombre || 'usuario' }}
          </p>
          <p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            {{ auth.currentUser()?.rol === 'provider' ? 'Proveedor' : 'Cliente' }}
          </p>
        </div>
        
        <button [routerLink]="auth.isProvider() ? '/proveedor/configuracion' : '/cliente/configuracion'" 
          class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
          <img *ngIf="auth.currentUser()?.avatar_url" [src]="auth.currentUser()?.avatar_url" alt="Perfil" class="w-full h-full object-cover" onerror="this.style.display='none'">
          <div *ngIf="!auth.currentUser()?.avatar_url" class="w-full h-full flex items-center justify-center text-primary font-bold">
            {{ (auth.currentUser()?.nombre_negocio || auth.currentUser()?.nombre || 'U').charAt(0).toUpperCase() }}
          </div>
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class HeaderDashboardComponent {
  auth = inject(AuthService);
  @Output() onMenuToggle = new EventEmitter<void>();
}

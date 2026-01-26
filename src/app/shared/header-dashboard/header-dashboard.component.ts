import { Component, inject, signal } from '@angular/core';
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
        <!-- Buscador o Título dinámico si se requiere -->
        <div class="relative hidden md:block">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input type="text" placeholder="Buscar..." 
            class="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all">
        </div>
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <!-- Modo Oscuro (Opcional por ahora) -->
        <button class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <span class="material-symbols-outlined">dark_mode</span>
        </button>

        <!-- Notificaciones -->
        <button class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative">
          <span class="material-symbols-outlined">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>

        <div class="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>

        <!-- Perfil Usuario -->
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
            <img *ngIf="auth.currentUser()?.avatar_url" [src]="auth.currentUser()?.avatar_url" alt="Perfil" class="w-full h-full object-cover">
            <div *ngIf="!auth.currentUser()?.avatar_url" class="w-full h-full flex items-center justify-center text-primary font-bold">
              {{ (auth.currentUser()?.nombre_negocio || auth.currentUser()?.nombre || 'U').charAt(0).toUpperCase() }}
            </div>
          </button>
        </div>
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
}

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent],
  templateUrl: './cliente-layout.component.html',
})
export class ClienteLayoutComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  items: MenuItem[] = [];
  showSidebar = true;
  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.items = [
      {
        label: 'Dashboard',
        icon: 'pi pi-chart-bar',
        routerLink: '/cliente/dashboard'
      },
      {
        label: 'Mis Solicitudes',
        icon: 'pi pi-file',
        routerLink: '/cliente/solicitudes'
      },
      {
        separator: true
      },
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-power-off',
        command: () => {
          this.auth.logout();
        }
      }
    ];

    // Ocultar sidebar en rutas de proveedor (ej: /cliente/proveedor/:id)
    this.sub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((ev: any) => {
      const url: string = ev.urlAfterRedirects || ev.url || '';
      // Si la ruta comienza con /cliente/proveedor ocultamos el sidebar
      this.showSidebar = !url.startsWith('/cliente/proveedor');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

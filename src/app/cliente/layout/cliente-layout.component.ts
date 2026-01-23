import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent, ConfirmDialogModule, RouterLink, RouterLinkActive],
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
        label: 'Configuración',
        icon: 'pi pi-cog',
        routerLink: '/cliente/configuracion'
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

    // Siempre mostrar sidebar en el layout de cliente
    this.showSidebar = true;
  }

  @HostListener('window:resize', ['$event'])
  onResize(_event: any) { }

  get isTablet(): boolean {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}


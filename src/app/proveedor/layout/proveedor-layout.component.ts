import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { HeaderDashboardComponent } from '../../shared/header-dashboard/header-dashboard.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../services/auth.service';
import { signal, OnDestroy } from '@angular/core';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-proveedor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent, HeaderDashboardComponent, ConfirmDialogModule, RouterLink, RouterLinkActive],
  templateUrl: './proveedor-layout.component.html',
})
export class ProveedorLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  items: MenuItem[] = [];
  private routerSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.items = [
      {
        label: 'Dashboard',
        icon: 'pi pi-chart-bar',
        routerLink: '/proveedor/dashboard'
      },
      {
        label: 'Paquetes',
        icon: 'pi pi-box',
        routerLink: '/proveedor/paquetes'
      },
      {
        label: 'Solicitudes',
        icon: 'pi pi-file',
        routerLink: '/proveedor/solicitudes'
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        routerLink: '/proveedor/configuracion'
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

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Logic for mobile closing if needed
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(_event: any) { }

  get isTablet(): boolean {
    return window.innerWidth <= 1100;
  }

  get isCompact(): boolean {
    return window.innerWidth > 1100 && window.innerWidth <= 1300;
  }

  navigateToItem(item: any) {
    if (item.command) {
      item.command({});
    } else if (item.routerLink) {
      this.router.navigate([item.routerLink]);
    }
  }
}

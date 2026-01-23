import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-proveedor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent, ConfirmDialogModule, RouterLink, RouterLinkActive],
  templateUrl: './proveedor-layout.component.html',
})
export class ProveedorLayoutComponent implements OnInit {
  auth = inject(AuthService);
  items: MenuItem[] = [];

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
        label: 'Calendario',
        icon: 'pi pi-calendar',
        routerLink: '/proveedor/agenda'
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
  }

  @HostListener('window:resize', ['$event'])
  onResize(_event: any) { }

  get isTablet(): boolean {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }
}

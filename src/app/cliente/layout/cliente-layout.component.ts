import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent],
  templateUrl: './cliente-layout.component.html',
})
export class ClienteLayoutComponent implements OnInit {
  auth = inject(AuthService);
  items: MenuItem[] = [];

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
        label: 'Marketplace',
        icon: 'pi pi-shopping-bag',
        routerLink: '/cliente/marketplace'
      },
      {
        separator: true
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        routerLink: '/cliente/configuracion'
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
}

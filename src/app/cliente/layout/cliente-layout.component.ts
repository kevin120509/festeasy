import { Component, inject, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription, map } from 'rxjs';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent, RouterLink, RouterLinkActive],
  templateUrl: './cliente-layout.component.html',
})
export class ClienteLayoutComponent implements OnInit, OnDestroy { // Added OnDestroy
  auth = inject(AuthService);
  public router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  items: MenuItem[] = [];
  showSidebar = true;
  isSidebarExpanded = signal(true);
  private sub: Subscription | null = null;
  private routerSubscription: Subscription | null = null; // New subscription for router events

  ngOnInit(): void {
    this.items = [
      {
        label: 'Dashboard',
        icon: 'pi pi-chart-bar',
        routerLink: '/cliente/dashboard'
      },
      {
        label: 'Notificaciones',
        icon: 'pi pi-bell',
        routerLink: '/cliente/notificaciones'
      },
      {
        label: 'Mis Solicitudes',
        icon: 'pi pi-file',
        routerLink: '/cliente/solicitudes'
      },
      {
        label: 'Carrito',
        icon: 'pi pi-shopping-cart',
        routerLink: '/cliente/carrito'
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
          this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres cerrar tu sesión?',
            header: 'Cerrar Sesión',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancelar',
            rejectButtonProps: {
              label: 'Cancelar',
              severity: 'secondary',
              outlined: true
            },
            acceptLabel: 'Sí, Salir',
            acceptButtonProps: {
              label: 'Sí, Salir',
              severity: 'danger'
            },
            accept: () => {
              this.auth.logout();
            }
          });
        }
      }
    ];

    // Listen to router events to determine sidebar visibility
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.data['hideSidebar'];
      })
    ).subscribe((hideSidebar: boolean) => {
      this.showSidebar = !hideSidebar;
    });
  }

  toggleSidebar() {
    this.isSidebarExpanded.update(value => !value);
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routerSubscription?.unsubscribe(); // Unsubscribe from router events
  }
}


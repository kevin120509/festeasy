import { Component, inject, OnInit, HostListener, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MenuItem, ConfirmationService } from 'primeng/api';
import { MenuComponent } from '../../shared/menu/menu.component';
import { HeaderDashboardComponent } from '../../shared/header-dashboard/header-dashboard.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '../../services/auth.service';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-proveedor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MenuComponent, HeaderDashboardComponent, RouterLink, RouterLinkActive, ConfirmDialogModule],
  templateUrl: './proveedor-layout.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ProveedorLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private subscriptionService = inject(SubscriptionService);

  isSidebarExpanded = signal(true);
  private routerSubscription: Subscription | null = null;

  // Menú reactivo basado en el estado de la suscripción y addons
  public menuItems = computed(() => {
    const baseItems: MenuItem[] = [
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
      }
    ];

    // Inyectar el constructor web si está activo
    const isActive = this.subscriptionService.isWebBuilderActive();
    console.log('🔍 Menu construction - isWebBuilderActive:', isActive);
    console.log('🔍 Active addons:', this.subscriptionService.allActiveAddons());

    if (isActive) {
      console.log('✅ Adding Mi Página Web to menu');
      baseItems.push({
        label: 'Mi Página Web',
        icon: 'pi pi-globe',
        routerLink: '/proveedor/web-builder'
      });
    } else {
      console.log('❌ Web Builder not active, menu item not added');
    }

    baseItems.push(
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
    );
    return baseItems;
  });

  ngOnInit(): void {
    // Forzar recarga de addons para asegurar que el menú se actualice
    this.subscriptionService.refreshConfigs();

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(_event: any) { }

  get isMobile(): boolean {
    return window.innerWidth <= 1024;
  }

  get isCompact(): boolean {
    if (!this.isSidebarExpanded()) return true;
    return window.innerWidth > 1024 && window.innerWidth <= 1440;
  }

  toggleSidebar() {
    this.isSidebarExpanded.set(!this.isSidebarExpanded());
  }

  navigateToItem(item: any) {
    if (item.command) {
      item.command({});
    } else if (item.routerLink) {
      this.router.navigate([item.routerLink]);
    }
  }
}

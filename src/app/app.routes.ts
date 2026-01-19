import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { adminGuard } from './guards/admin.guard';

// Shared
import { LandingComponent } from './shared/landing/landing';
import { LoginComponent } from './shared/login/login';

// Error Pages
import { NotFoundComponent } from './shared/errors/not-found/not-found.component';
import { ServerErrorComponent } from './shared/errors/server-error/server-error.component';
import { AccessDeniedComponent } from './shared/errors/access-denied/access-denied.component';

// Cliente
import { ClienteRegistroComponent } from './cliente/registro/registro.component';
import { MarketplaceComponent } from './cliente/marketplace/marketplace.component';
import { ProveedorDetalleComponent } from './cliente/proveedor-detalle/proveedor-detalle.component';
import { CarritoComponent } from './cliente/carrito/carrito.component';
import { ClienteDashboardComponent } from './cliente/dashboard/dashboard.component';
import { CrearSolicitudComponent } from './cliente/solicitudes/crear-solicitud.component';
import { MisSolicitudesComponent } from './cliente/solicitudes/solicitudes.component';
import { ClienteConfiguracionComponent } from './cliente/configuracion/configuracion.component';
import { SeguimientoEventoComponent } from './cliente/seguimiento/seguimiento.component';

// Proveedor
import { ProveedorRegistroComponent } from './proveedor/registro/registro.component';
import { ProveedorDashboardComponent } from './proveedor/dashboard/dashboard.component';
import { SolicitudesComponent } from './proveedor/solicitudes/solicitudes.component';
import { AgendaComponent } from './proveedor/agenda/agenda.component';
import { NotificacionesComponent } from './proveedor/notificaciones/notificaciones.component';
import { PaquetesComponent } from './proveedor/paquetes/paquetes.component';
import { ProveedorConfiguracionComponent } from './proveedor/configuracion/configuracion';

// Admin
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { UserManagementComponent } from './admin/users/user-management.component';
import { ProviderApprovalComponent } from './admin/provider-approval/provider-approval.component';

export const routes: Routes = [
    // General
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },

    // Error Pages
    { path: '404', component: NotFoundComponent },
    { path: '500', component: ServerErrorComponent },
    { path: '403', component: AccessDeniedComponent },

    // Cliente
    { path: 'cliente/registro', component: ClienteRegistroComponent },
    { path: 'cliente/marketplace', component: MarketplaceComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/proveedor/:id', component: ProveedorDetalleComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/carrito', component: CarritoComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/dashboard', component: ClienteDashboardComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/solicitudes', component: MisSolicitudesComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/solicitudes/crear', component: CrearSolicitudComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/seguimiento', component: SeguimientoEventoComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/configuracion', component: ClienteConfiguracionComponent, canActivate: [roleGuard], data: { role: 'client' } },

    // Proveedor
    { path: 'proveedor/registro', component: ProveedorRegistroComponent },
    { path: 'proveedor/dashboard', component: ProveedorDashboardComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/solicitudes', component: SolicitudesComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/agenda', component: AgendaComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/notificaciones', component: NotificacionesComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/paquetes', component: PaquetesComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/configuracion', component: ProveedorConfiguracionComponent, canActivate: [roleGuard], data: { role: 'provider' } },

    // Admin
    { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
    { path: 'admin/users', component: UserManagementComponent, canActivate: [adminGuard] },
    { path: 'admin/providers/approval', component: ProviderApprovalComponent, canActivate: [adminGuard] },

    // Fallback - debe ser la última ruta
    { path: '**', component: NotFoundComponent }
];
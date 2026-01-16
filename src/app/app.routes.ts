import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

// Shared
import { LandingComponent } from './shared/landing/landing';
import { LoginComponent } from './shared/login/login';

// Cliente
import { ClienteRegistroComponent } from './cliente/registro/registro';
import { MarketplaceComponent } from './cliente/marketplace/marketplace';
import { ProveedorDetalleComponent } from './cliente/proveedor-detalle/proveedor-detalle';
import { CarritoComponent } from './cliente/carrito/carrito';
import { ClienteDashboardComponent } from './cliente/dashboard/dashboard';
import { CrearSolicitudComponent } from './cliente/solicitudes/crear-solicitud.component';

// Proveedor
import { ProveedorRegistroComponent } from './proveedor/registro/registro';
import { ProveedorDashboardComponent } from './proveedor/dashboard/dashboard';
import { SolicitudesComponent } from './proveedor/solicitudes/solicitudes';
import { AgendaComponent } from './proveedor/agenda/agenda';
import { NotificacionesComponent } from './proveedor/notificaciones/notificaciones';
import { PaquetesComponent } from './proveedor/paquetes/paquetes';
import { ProveedorConfiguracionComponent } from './proveedor/configuracion/configuracion';

export const routes: Routes = [
    // General
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },

    // Cliente
    { path: 'cliente/registro', component: ClienteRegistroComponent },
<<<<<<< HEAD
    { path: 'cliente/marketplace', component: MarketplaceComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/proveedor/:id', component: ProveedorDetalleComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/carrito', component: CarritoComponent, canActivate: [roleGuard], data: { role: 'client' } },
    { path: 'cliente/dashboard', component: ClienteDashboardComponent, canActivate: [roleGuard], data: { role: 'client' } },
=======
    { path: 'cliente/marketplace', component: MarketplaceComponent },
    { path: 'cliente/proveedor/:id', component: ProveedorDetalleComponent },
    { path: 'cliente/carrito', component: CarritoComponent },
    { path: 'cliente/dashboard', component: ClienteDashboardComponent },
    { path: 'cliente/solicitudes', component: CrearSolicitudComponent },
>>>>>>> 935be22e51c82e0b258eb3f02368fee274b5d828

    // Proveedor
    { path: 'proveedor/registro', component: ProveedorRegistroComponent },
    { path: 'proveedor/dashboard', component: ProveedorDashboardComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/solicitudes', component: SolicitudesComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/agenda', component: AgendaComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/notificaciones', component: NotificacionesComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/paquetes', component: PaquetesComponent, canActivate: [roleGuard], data: { role: 'provider' } },
    { path: 'proveedor/configuracion', component: ProveedorConfiguracionComponent, canActivate: [roleGuard], data: { role: 'provider' } },

    // Fallback
    { path: '**', redirectTo: '' }
];

import { Routes } from '@angular/router';

// Shared
import { LandingComponent } from './shared/landing/landing';
import { LoginComponent } from './shared/login/login';

// Cliente
import { ClienteRegistroComponent } from './cliente/registro/registro';
import { MarketplaceComponent } from './cliente/marketplace/marketplace';
import { ProveedorDetalleComponent } from './cliente/proveedor-detalle/proveedor-detalle';
import { CarritoComponent } from './cliente/carrito/carrito';
import { ClienteDashboardComponent } from './cliente/dashboard/dashboard';

// Proveedor
import { ProveedorRegistroComponent } from './proveedor/registro/registro';
import { ProveedorDashboardComponent } from './proveedor/dashboard/dashboard';
import { SolicitudesComponent } from './proveedor/solicitudes/solicitudes';
import { AgendaComponent } from './proveedor/agenda/agenda';
import { NotificacionesComponent } from './proveedor/notificaciones/notificaciones';

export const routes: Routes = [
    // General
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },

    // Cliente
    { path: 'cliente/registro', component: ClienteRegistroComponent },
    { path: 'cliente/marketplace', component: MarketplaceComponent },
    { path: 'cliente/proveedor/:id', component: ProveedorDetalleComponent },
    { path: 'cliente/carrito', component: CarritoComponent },
    { path: 'cliente/dashboard', component: ClienteDashboardComponent },

    // Proveedor
    { path: 'proveedor/registro', component: ProveedorRegistroComponent },
    { path: 'proveedor/dashboard', component: ProveedorDashboardComponent },
    { path: 'proveedor/solicitudes', component: SolicitudesComponent },
    { path: 'proveedor/agenda', component: AgendaComponent },
    { path: 'proveedor/notificaciones', component: NotificacionesComponent },

    // Fallback
    { path: '**', redirectTo: '' }
];

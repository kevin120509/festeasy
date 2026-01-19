import { Routes } from '@angular/router';

// Shared
import { LandingComponent } from './shared/landing/landing';
import { LoginComponent } from './shared/login/login';

// Cliente
import { ClienteRegistroComponent } from './cliente/registro/registro.component';
import { MarketplaceComponent } from './cliente/marketplace/marketplace.component';
import { ProveedorDetalleComponent } from './cliente/proveedor-detalle/proveedor-detalle.component';
import { CarritoComponent } from './cliente/carrito/carrito.component';
import { ClienteDashboardComponent } from './cliente/dashboard/dashboard.component';
import { CrearSolicitudComponent } from './cliente/solicitudes/crear-solicitud.component';
import { MisSolicitudesComponent } from './cliente/solicitudes/solicitudes.component';
import { ClienteConfiguracionComponent } from './cliente/configuracion/configuracion.component';

// Proveedor
import { ProveedorRegistroComponent } from './proveedor/registro/registro.component';
import { ProveedorDashboardComponent } from './proveedor/dashboard/dashboard.component';
import { SolicitudesComponent } from './proveedor/solicitudes/solicitudes.component';
import { AgendaComponent } from './proveedor/agenda/agenda.component';
import { NotificacionesComponent } from './proveedor/notificaciones/notificaciones.component';
import { PaquetesComponent } from './proveedor/paquetes/paquetes.component';
import { ProveedorConfiguracionComponent } from './proveedor/configuracion/configuracion';

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
    { path: 'cliente/solicitudes', component: MisSolicitudesComponent },
    { path: 'cliente/solicitudes/crear', component: CrearSolicitudComponent },
    { path: 'cliente/configuracion', component: ClienteConfiguracionComponent },

    // Proveedor
    { path: 'proveedor/registro', component: ProveedorRegistroComponent },
    { path: 'proveedor/dashboard', component: ProveedorDashboardComponent },
    { path: 'proveedor/solicitudes', component: SolicitudesComponent },
    { path: 'proveedor/agenda', component: AgendaComponent },
    { path: 'proveedor/notificaciones', component: NotificacionesComponent },
    { path: 'proveedor/paquetes', component: PaquetesComponent },
    { path: 'proveedor/configuracion', component: ProveedorConfiguracionComponent },

    // Fallback
    { path: '**', redirectTo: '' }
];

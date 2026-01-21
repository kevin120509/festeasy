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

import { ClienteLayoutComponent } from './cliente/layout/cliente-layout.component';
import { ClienteRegistroComponent } from './cliente/registro/registro.component';
import { MarketplaceComponent } from './cliente/marketplace/marketplace.component';
import { ProveedorDetalleComponent } from './cliente/proveedor-detalle/proveedor-detalle.component';
import { CarritoComponent } from './cliente/carrito/carrito.component';
import { ClienteDashboardComponent } from './cliente/dashboard/dashboard.component';
import { CrearEventoComponent } from './cliente/crear-evento/crear-evento.component';
import { RevisarSolicitudComponent } from './cliente/solicitudes/revisar/revisar.component';
import { MisSolicitudesComponent } from './cliente/solicitudes/solicitudes.component';
import { ClienteConfiguracionComponent } from './cliente/configuracion/configuracion.component';
import { SeguimientoEventoComponent } from './cliente/seguimiento/seguimiento.component';
import { SolicitudEnviadaComponent } from './cliente/solicitud-enviada/solicitud-enviada.component';
import { PagoComponent } from './cliente/pago/pago.component';

// Proveedor
import { ProveedorRegistroComponent } from './proveedor/registro/registro.component';
import { ProveedorDashboardComponent } from './proveedor/dashboard/dashboard.component';
import { SolicitudesComponent } from './proveedor/solicitudes/solicitudes.component';
import { BandejaSolicitudesComponent } from './proveedor/bandeja-solicitudes/bandeja-solicitudes.component';
import { AgendaComponent } from './proveedor/agenda/agenda.component';
import { NotificacionesComponent } from './proveedor/notificaciones/notificaciones.component';
import { PaquetesComponent } from './proveedor/paquetes/paquetes.component';
import { ProveedorConfiguracionComponent } from './proveedor/configuracion/configuracion';
import { ProveedorLayoutComponent } from './proveedor/layout/proveedor-layout.component';

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
    {
        path: 'cliente',
        component: ClienteLayoutComponent,
        canActivate: [roleGuard],
        data: { role: 'client' },
        children: [
            { path: 'dashboard', component: ClienteDashboardComponent },
            { path: 'marketplace', component: MarketplaceComponent },
            { path: 'proveedor/:id', component: ProveedorDetalleComponent },
            { path: 'carrito', component: CarritoComponent },
            { path: 'solicitudes', component: MisSolicitudesComponent },
            { path: 'solicitudes/crear', component: CrearEventoComponent },
            { path: 'solicitudes/revisar', component: RevisarSolicitudComponent },
            { path: 'solicitudes/:id', component: SolicitudEnviadaComponent },
            { path: 'pagos/:id', component: PagoComponent },
            { path: 'solicitud-enviada', component: SolicitudEnviadaComponent },
            { path: 'seguimiento/:id', component: SeguimientoEventoComponent },
            { path: 'configuracion', component: ClienteConfiguracionComponent },
        ]
    },


    // Proveedor
    { path: 'proveedor/registro', component: ProveedorRegistroComponent },
    {
        path: 'proveedor',
        component: ProveedorLayoutComponent,
        canActivate: [roleGuard],
        data: { role: 'provider' },
        children: [
            { path: 'dashboard', component: ProveedorDashboardComponent },
            { path: 'solicitudes', component: SolicitudesComponent },
            { path: 'bandeja', component: BandejaSolicitudesComponent },
            { path: 'agenda', component: AgendaComponent },
            { path: 'notificaciones', component: NotificacionesComponent },
            { path: 'paquetes', component: PaquetesComponent },
            { path: 'configuracion', component: ProveedorConfiguracionComponent },
        ]
    },

    // Admin
    { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
    { path: 'admin/users', component: UserManagementComponent, canActivate: [adminGuard] },
    { path: 'admin/providers/approval', component: ProviderApprovalComponent, canActivate: [adminGuard] },

    // Fallback - debe ser la última ruta
    { path: '**', component: NotFoundComponent }
];
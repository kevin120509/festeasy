import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { adminGuard } from './core/guards/admin.guard';

// Shared -> Pages
import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/login/login';

// Error Pages -> Pages/Errors
import { NotFoundComponent } from './pages/errors/not-found/not-found.component';
import { ServerErrorComponent } from './pages/errors/server-error/server-error.component';
import { AccessDeniedComponent } from './pages/errors/access-denied/access-denied.component';

// Cliente -> Pages/Cliente
import { ClienteLayoutComponent } from './pages/cliente/layout/cliente-layout.component';
import { ClienteRegistroComponent } from './pages/cliente/registro/registro.component';
import { MarketplaceComponent } from './pages/cliente/marketplace/marketplace.component';
import { ProveedorDetalleComponent } from './pages/cliente/proveedor-detalle/proveedor-detalle.component';
import { CarritoComponent } from './pages/cliente/carrito/carrito.component';
import { ClienteDashboardComponent } from './pages/cliente/dashboard/dashboard.component';
import { CrearEventoComponent } from './pages/cliente/crear-evento/crear-evento.component';
import { RevisarSolicitudComponent } from './pages/cliente/solicitudes/revisar/revisar.component';
import { MisSolicitudesComponent } from './pages/cliente/solicitudes/solicitudes.component';
import { ClienteConfiguracionComponent } from './pages/cliente/configuracion/configuracion.component';
import { SeguimientoEventoComponent } from './pages/cliente/seguimiento/seguimiento.component';
import { SolicitudEnviadaComponent } from './pages/cliente/solicitud-enviada/solicitud-enviada.component';
import { PagoComponent } from './pages/cliente/pago/pago.component';
import { ResenasSummaryComponent } from './pages/cliente/resenas/resenas-summary/resenas-summary.component';
import { ResenaFormComponent } from './pages/cliente/resenas/resena-form/resena-form.component';
import { ResenaExitoComponent } from './pages/cliente/resenas/resena-exito/resena-exito.component';
import { PaqueteDetalleComponent } from './pages/cliente/paquete-detalle/paquete-detalle.component';

// Proveedor -> Pages/Proveedor
import { ProveedorRegistroComponent } from './pages/proveedor/registro/registro.component';
import { ProveedorDashboardComponent } from './pages/proveedor/dashboard/dashboard.component';
import { SolicitudesComponent } from './pages/proveedor/solicitudes/solicitudes.component';
import { SolicitudDetalleComponent } from './pages/proveedor/solicitudes/detalle/solicitud-detalle.component';
import { BandejaSolicitudesComponent } from './pages/proveedor/bandeja-solicitudes/bandeja-solicitudes.component';
import { NotificacionesComponent } from './pages/proveedor/notificaciones/notificaciones.component';
import { PaquetesComponent } from './pages/proveedor/paquetes/paquetes.component';
import { ProveedorConfiguracionComponent } from './pages/proveedor/configuracion/configuracion';
import { ProveedorLayoutComponent } from './pages/proveedor/layout/proveedor-layout.component';
import { ResenasRecibidasComponent } from './pages/proveedor/resenas/resenas-recibidas.component';

// Admin -> Pages/Admin
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { UserManagementComponent } from './pages/admin/users/user-management.component';
import { ProviderApprovalComponent } from './pages/admin/provider-approval/provider-approval.component';

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
            { path: 'marketplace', component: MarketplaceComponent, data: { hideSidebar: true } },
            { path: 'solicitudes/crear', component: CrearEventoComponent },
            { path: 'solicitudes/revisar', component: RevisarSolicitudComponent },
            { path: 'solicitud-enviada', component: SolicitudEnviadaComponent },
            { path: 'proveedor/:id', component: ProveedorDetalleComponent, data: { hideSidebar: true } },
            { path: 'paquete/:id', component: PaqueteDetalleComponent, data: { hideSidebar: true } },
            { path: 'seguimiento/:id', component: SeguimientoEventoComponent },
            { path: 'carrito', component: CarritoComponent },
            { path: 'solicitudes', component: MisSolicitudesComponent },
            { path: 'solicitudes/:id', component: SolicitudEnviadaComponent },
            { path: 'pago/:id', component: PagoComponent },
            { path: 'configuracion', component: ClienteConfiguracionComponent },
            { path: 'resenas/resumen', component: ResenasSummaryComponent },
            { path: 'resenas/resumen/:eventoId', component: ResenasSummaryComponent },
            { path: 'resenas/crear/:solicitudId', component: ResenaFormComponent },
            { path: 'resenas/exito', component: ResenaExitoComponent },
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
            { path: 'solicitudes/:id', component: SolicitudDetalleComponent },
            { path: 'solicitudes', component: BandejaSolicitudesComponent },
            { path: 'bandeja', component: BandejaSolicitudesComponent },
            { path: 'notificaciones', component: NotificacionesComponent },
            { path: 'paquetes', component: PaquetesComponent },
            { path: 'resenas', component: ResenasRecibidasComponent },
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
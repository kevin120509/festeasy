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
import { ResenasSummaryComponent } from './cliente/resenas/resenas-summary/resenas-summary.component';
import { ResenaFormComponent } from './cliente/resenas/resena-form/resena-form.component';
import { ResenaExitoComponent } from './cliente/resenas/resena-exito/resena-exito.component';

// Proveedor
import { ProveedorRegistroComponent } from './proveedor/registro/registro.component';
import { ProveedorDashboardComponent } from './proveedor/dashboard/dashboard.component';
import { SolicitudesComponent } from './proveedor/solicitudes/solicitudes.component';
import { BandejaSolicitudesComponent } from './proveedor/bandeja-solicitudes/bandeja-solicitudes.component';
import { NotificacionesComponent } from './proveedor/notificaciones/notificaciones.component';
import { PaquetesComponent } from './proveedor/paquetes/paquetes.component';
import { ProveedorConfiguracionComponent } from './proveedor/configuracion/configuracion';
import { ProveedorLayoutComponent } from './proveedor/layout/proveedor-layout.component';
import { ResenasRecibidasComponent } from './proveedor/resenas/resenas-recibidas.component';

// Admin
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { UserManagementComponent } from './admin/users/user-management.component';
import { ProviderApprovalComponent } from './admin/provider-approval/provider-approval.component';
import { PaqueteDetalleComponent } from './cliente/paquete-detalle/paquete-detalle.component';
import { SolicitudDetalleComponent } from './proveedor/solicitudes/detalle/solicitud-detalle.component';
import { ProviderPublicPageComponent } from './public/provider-page/provider-page.component';
import { WebBuilderComponent } from './proveedor/web-builder/web-builder.component';
import { webBuilderGuard } from './guards/web-builder.guard';

export const routes: Routes = [
    // General
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },

    // Error Pages
    { path: '404', component: NotFoundComponent },
    { path: '500', component: ServerErrorComponent },
    { path: '403', component: AccessDeniedComponent },

    {
        path: 'terminos',
        loadComponent: () => import('./pages/public/legal/terminos.component').then(m => m.TerminosComponent)
    },
    {
        path: 'privacidad',
        loadComponent: () => import('./pages/public/legal/privacidad.component').then(m => m.PrivacidadComponent)
    },
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
            { path: 'web-builder', component: WebBuilderComponent, canActivate: [webBuilderGuard] },
        ]
    },

    // Admin
    { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
    { path: 'admin/users', component: UserManagementComponent, canActivate: [adminGuard] },
    { path: 'admin/packages', loadComponent: () => import('./admin/packages/admin-package-management.component').then(m => m.AdminPackageManagementComponent), canActivate: [adminGuard] },
    { path: 'admin/subscriptions', loadComponent: () => import('./admin/subscriptions/subscription-management.component').then(m => m.SubscriptionManagementComponent), canActivate: [adminGuard] },
    { path: 'admin/providers/approval', component: ProviderApprovalComponent, canActivate: [adminGuard] },

    { path: 'p/:slug', component: ProviderPublicPageComponent },
    { path: 'v/:negocio', loadComponent: () => import('./pages/public/portafolio/portafolio.component').then(c => c.PortafolioComponent) },

    // Fallback - debe ser la última ruta
    { path: '**', component: NotFoundComponent }
];
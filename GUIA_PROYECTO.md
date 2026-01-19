# 🎉 Guía del Proyecto FestEasy - Documentación para IA

## 📋 Índice
1. [Reglas del Proyecto](#reglas-del-proyecto)
2. [Resumen del Proyecto](#resumen-del-proyecto)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Arquitectura](#arquitectura)
5. [Tecnologías](#tecnologías)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Rutas y Navegación](#rutas-y-navegación)
8. [Servicios Principales](#servicios-principales)
9. [Modelos de Datos](#modelos-de-datos)
10. [Componentes Clave](#componentes-clave)
11. [Convenciones de Código](#convenciones-de-código)
12. [Flujos Importantes](#flujos-importantes)

---

## 🎯 Reglas del Proyecto

### Versión y Framework
- **Angular**: 21.1.0
- **Componentes**: Standalone Components (sin NgModules)
- **Estado**: Angular Signals
- **Sintaxis**: Nueva sintaxis de control flow (`@if`, `@for`, `@switch`)

### Arquitectura y Servicios
- **HTTP**: Usar SIEMPRE `ApiService` para todas las llamadas HTTP
- **Autenticación**: Usar SIEMPRE `AuthService` para gestión de sesión
- **Guards**: Leer directamente de `localStorage`, NO de signals

### Estilos
- **Framework CSS**: **Tailwind CSS exclusivamente**
- **Color Primary**: `--color-primary: #FF3D3D` (rojo)
- **NO usar**: Inline styles, CSS modules, o frameworks externos

### Modelos de Datos
- **Seguir fielmente**: Las interfaces TypeScript en `src/app/models/index.ts`
- **Basado en**: Esquema de base de datos SQL
- **Principales modelos**:
  - `User`, `ClientProfile`, `ProviderProfile`
  - `ServiceRequest`, `Quote`
  - `ProviderPackage`, `Review`

### Branding
- **Logo**: 🎈 Globo rojo con cursor de clic
- **Nombre**: FestEasy
- **Slogan**: "Tu evento, sin estrés"

---

## 1. Resumen del Proyecto

**FestEasy** es una plataforma web para conectar clientes que organizan eventos con proveedores de servicios (mobiliario, catering, música, decoración, etc.).

### Roles de Usuario
- **Cliente**: Busca proveedores, solicita servicios, gestiona eventos
- **Proveedor**: Ofrece servicios, recibe solicitudes, envía cotizaciones

### Framework Principal
- **Angular 17** (standalone components)
- **TypeScript**
- **Tailwind CSS** para estilos

---

## 2. Estructura de Carpetas

```
festeasy-web-v1/
├── src/
│   ├── app/
│   │   ├── cliente/               # Módulo de Cliente
│   │   │   ├── registro/          # Registro de cliente
│   │   │   ├── dashboard/         # Dashboard del cliente
│   │   │   ├── marketplace/       # Búsqueda de proveedores
│   │   │   ├── proveedor-detalle/ # Detalle de proveedor
│   │   │   ├── carrito/           # Carrito de servicios
│   │   │   └── solicitudes/       # Crear solicitudes
│   │   │
│   │   ├── proveedor/             # Módulo de Proveedor
│   │   │   ├── registro/          # Registro de proveedor
│   │   │   ├── dashboard/         # Dashboard del proveedor
│   │   │   ├── solicitudes/       # Ver y gestionar solicitudes
│   │   │   ├── paquetes/          # Gestión de paquetes de servicios
│   │   │   ├── agenda/            # Calendario de eventos
│   │   │   ├── notificaciones/    # Notificaciones
│   │   │   └── configuracion/     # Configuración de perfil
│   │   │
│   │   ├── shared/                # Componentes compartidos
│   │   │   ├── header/            # Header de la aplicación
│   │   │   ├── landing/           # Página de inicio
│   │   │   └── login/             # Página de login
│   │   │
│   │   ├── services/              # Servicios globales
│   │   │   ├── api.service.ts     # Comunicación con backend
│   │   │   └── auth.service.ts    # Gestión de autenticación
│   │   │
│   │   ├── guards/                # Guards de rutas
│   │   │   ├── auth.guard.ts      # Verifica autenticación
│   │   │   └── role.guard.ts      # Verifica roles
│   │   │
│   │   ├── models/                # Interfaces TypeScript
│   │   │   └── index.ts           # Definiciones de tipos
│   │   │
│   │   ├── app.routes.ts          # Configuración de rutas
│   │   └── app.component.ts       # Componente raíz
│   │
│   ├── assets/                    # Recursos estáticos
│   ├── environments/              # Variables de entorno
│   └── styles.css                 # Estilos globales
```

---

## 3. Arquitectura

### Patrón Arquitectónico
**Component-Based Architecture** con:
- **Standalone Components** (Angular 17)
- **Reactive Programming** con RxJS
- **Signals** para estado reactivo local
- **Services** para lógica compartida

### Capas de la Aplicación

```
┌─────────────────────────────────────┐
│         COMPONENTES (UI)            │
│   - Cliente Dashboard               │
│   - Proveedor Solicitudes           │
│   - Shared Components               │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│    SERVICIOS (Lógica de Negocio)   │
│   - ApiService                      │
│   - AuthService                     │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│     GUARDS (Seguridad de Rutas)    │
│   - authGuard                       │
│   - roleGuard                       │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      LOCAL STORAGE (Persistencia)  │
│   - festeasy_token                  │
│   - festeasy_user                   │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│        BACKEND API (REST)           │
│   - /usuarios                       │
│   - /solicitudes                    │
│   - /cotizaciones                   │
│   - /paquetes                       │
└─────────────────────────────────────┘
```

---

## 4. Tecnologías

### Core
- **Angular 17** - Framework frontend
- **TypeScript** - Lenguaje tipado
- **RxJS** - Programación reactiva

### Estilos
- **Tailwind CSS** - Framework CSS utility-first
- **CSS Custom Properties** - Variables CSS personalizadas

### Estado y Datos
- **Angular Signals** - Estado reactivo (Angular 17)
- **localStorage** - Persistencia de sesión
- **HttpClient** - Comunicación HTTP

### Herramientas
- **Angular CLI** - Desarrollo y build
- **Git** - Control de versiones

---

## 5. Autenticación y Seguridad

### 🔑 Sistema de Autenticación

**CRÍTICO**: El sistema usa **localStorage directo** en los guards, NO signals.

#### AuthService
**Ubicación**: `src/app/services/auth.service.ts`

```typescript
class AuthService {
  // Signals para UI reactiva (NO usados en guards)
  isLoggedIn = signal(this.hasToken());
  currentUser = signal<any>(this.getStoredUser());

  // Métodos para gestión de sesión
  login(token: string, user: any): void {
    localStorage.setItem('festeasy_token', token);
    localStorage.setItem('festeasy_user', JSON.stringify(user));
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem('festeasy_token');
    localStorage.removeItem('festeasy_user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('festeasy_token');
  }
}
```

#### Guards (Protección de Rutas)

**authGuard** - Verifica si hay token
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('festeasy_token');
  if (token) return true;
  
  router.navigate(['/login']);
  return false;
};
```

**roleGuard** - Verifica rol del usuario
```typescript
export const roleGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('festeasy_token');
  const userStr = localStorage.getItem('festeasy_user');
  
  if (!token || !userStr) {
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userStr);
  const requiredRole = route.data['role']; // 'client' o 'provider'

  if (user.rol === requiredRole) return true;

  // Redirigir a dashboard correcto
  if (user.rol === 'client') router.navigate(['/cliente/dashboard']);
  if (user.rol === 'provider') router.navigate(['/proveedor/dashboard']);
  
  return false;
};
```

### 🔒 Datos en localStorage

```javascript
// Token JWT
localStorage.getItem('festeasy_token')
// → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Usuario completo
localStorage.getItem('festeasy_user')
// → {"id":"123","correo_electronico":"user@example.com","rol":"client"}
```

---

## 6. Rutas y Navegación

**Ubicación**: `src/app/app.routes.ts`

### Rutas Públicas (Sin Guard)
```typescript
{ path: '', component: LandingComponent }
{ path: 'login', component: LoginComponent }
{ path: 'cliente/registro', component: ClienteRegistroComponent }
{ path: 'proveedor/registro', component: ProveedorRegistroComponent }
```

### Rutas de Cliente (roleGuard con rol='client')
```typescript
{ path: 'cliente/marketplace', canActivate: [roleGuard], data: { role: 'client' } }
{ path: 'cliente/dashboard', canActivate: [roleGuard], data: { role: 'client' } }
{ path: 'cliente/carrito', canActivate: [roleGuard], data: { role: 'client' } }
{ path: 'cliente/solicitudes', canActivate: [roleGuard], data: { role: 'client' } }
```

### Rutas de Proveedor (roleGuard con rol='provider')
```typescript
{ path: 'proveedor/dashboard', canActivate: [roleGuard], data: { role: 'provider' } }
{ path: 'proveedor/solicitudes', canActivate: [roleGuard], data: { role: 'provider' } }
{ path: 'proveedor/paquetes', canActivate: [roleGuard], data: { role: 'provider' } }
{ path: 'proveedor/agenda', canActivate: [roleGuard], data: { role: 'provider' } }
```

### Navegación Correcta

**IMPORTANTE**: Después del registro, usar `window.location.href` para forzar recarga:

```typescript
// ✅ CORRECTO - Fuerza recarga completa
window.location.href = '/cliente/dashboard';

// ❌ INCORRECTO - Puede causar problemas con guards
this.router.navigate(['/cliente/dashboard']);
```

---

## 7. Servicios Principales

### ApiService
**Ubicación**: `src/app/services/api.service.ts`

Maneja TODA la comunicación con el backend.

```typescript
class ApiService {
  private API_URL = environment.apiUrl;

  // Autenticación
  login(email: string, password: string): Observable<any>
  register(data: Partial<User>): Observable<User>

  // Usuarios
  getUser(id: string): Observable<User>
  updateUser(id: string, data: Partial<User>): Observable<User>

  // Perfiles
  createClientProfile(data: Partial<ClientProfile>): Observable<ClientProfile>
  createProviderProfile(data: Partial<ProviderProfile>): Observable<ProviderProfile>
  getProviderProfile(userId: string): Observable<ProviderProfile>

  // Solicitudes
  getClientRequests(): Observable<ServiceRequest[]>
  getProviderRequests(): Observable<ServiceRequest[]>
  createRequest(data: Partial<ServiceRequest>): Observable<ServiceRequest>
  updateRequestStatus(id: string, status: string): Observable<ServiceRequest>

  // Cotizaciones
  createQuote(data: Partial<Quote>): Observable<Quote>
  getQuotes(): Observable<Quote[]>
  updateQuote(id: string, data: Partial<Quote>): Observable<Quote>

  // Paquetes
  getPackages(): Observable<ProviderPackage[]>
  createPackage(data: Partial<ProviderPackage>): Observable<ProviderPackage>
  updatePackage(id: string, data: Partial<ProviderPackage>): Observable<ProviderPackage>

  // Headers con autenticación
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('festeasy_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }
}
```

### AuthService
Ver sección [Autenticación y Seguridad](#autenticación-y-seguridad)

---

## 8. Modelos de Datos

**Ubicación**: `src/app/models/index.ts`

### User (Usuario Base)
```typescript
interface User {
  id: string;
  correo_electronico: string;
  contrasena?: string;
  rol: 'client' | 'provider';
  creado_en: string;
}
```

### ClientProfile (Perfil de Cliente)
```typescript
interface ClientProfile {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  telefono?: string;
  avatar_url?: string;
}
```

### ProviderProfile (Perfil de Proveedor)
```typescript
interface ProviderProfile {
  id: string;
  usuario_id: string;
  nombre_negocio: string;
  descripcion?: string;
  telefono?: string;
  direccion_formato?: string;
  latitud?: number;
  longitud?: number;
  radio_cobertura_km?: number;
  categoria_servicio?: string;
  avatar_url?: string;
  calificacion_promedio?: number;
}
```

### ServiceRequest (Solicitud de Servicio)
```typescript
interface ServiceRequest {
  id: string;
  numero_solicitud: number;
  cliente_usuario_id: string;
  proveedor_usuario_id: string;
  fecha_servicio: string;
  direccion_servicio: string;
  titulo_evento?: string;
  estado: 'pendiente_aprobacion' | 'negociacion' | 'aceptada' | 'rechazada' | 'completada' | 'cancelada';
  creado_en: string;
}
```

### Quote (Cotización)
```typescript
interface Quote {
  id: string;
  solicitud_id: string;
  proveedor_usuario_id: string;
  precio_total_propuesto: number;
  desglose_json?: any;
  notas?: string;
  estado: 'pendiente' | 'aceptada_cliente' | 'rechazada_cliente';
  creado_en: string;
}
```

### ProviderPackage (Paquete de Proveedor)
```typescript
interface ProviderPackage {
  id: string;
  proveedor_usuario_id: string;
  nombre_paquete: string;
  descripcion?: string;
  precio_base?: number;
  items_incluidos_json?: any;
  imagen_url?: string;
  activo: boolean;
}
```

---

## 9. Componentes Clave

### Cliente Dashboard
**Ubicación**: `src/app/cliente/dashboard/`

**Funcionalidad**:
- Muestra eventos activos del cliente
- Lista solicitudes recientes
- Muestra sección "Mis Eventos" con todas las solicitudes

**Signals importantes**:
```typescript
misSolicitudes = signal<ServiceRequest[]>([]);
actividades = signal<any[]>([]);
```

### Proveedor Dashboard
**Ubicación**: `src/app/proveedor/dashboard/`

**Funcionalidad**:
- Métricas del proveedor (solicitudes, pagos, ingresos)
- Solicitudes pendientes
- Pagos recientes

**Sidebar con navegación**:
- Dashboard
- Paquetes
- Solicitudes ← usa `routerLink="/proveedor/solicitudes"`
- Cotizaciones
- Calendario
- Pagos
- Configuración

### Proveedor Solicitudes
**Ubicación**: `src/app/proveedor/solicitudes/`

**Funcionalidad**:
- Ver solicitudes recibidas
- Aceptar → Abre prompt para precio → Crea cotización → Cambia estado a 'negociacion'
- Rechazar → Cambia estado a 'rechazada'

**Flujo de Aceptación**:
```typescript
aceptar(id: string) {
  // 1. Pedir precio con window.prompt
  const precio = parseFloat(window.prompt('Precio propuesto:'));
  
  // 2. Crear cotización
  this.api.createQuote({
    solicitud_id: id,
    proveedor_usuario_id: currentUser.id,
    precio_total_propuesto: precio,
    estado: 'pendiente'
  });

  // 3. Actualizar estado de solicitud
  this.api.updateRequestStatus(id, 'negociacion');
}
```

### Registro de Cliente
**Ubicación**: `src/app/cliente/registro/`

**Flujo**:
1. Registrar usuario con `api.register({ rol: 'client' })`
2. Hacer login con `api.login(email, password)`
3. Guardar sesión con `auth.login(token, user)`
4. Crear perfil con `api.createClientProfile()`
5. **Redirigir con `window.location.href = '/cliente/dashboard'`**

---

## 10. Convenciones de Código

### Estructura de Componentes Standalone
```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './component.html'
})
export class ComponentNameComponent {
  // Inyección de dependencias con inject()
  private api = inject(ApiService);
  private auth = inject(AuthService);

  // Signals para estado reactivo
  data = signal<any[]>([]);
  loading = signal(false);

  // Métodos
  loadData() {
    this.loading.set(true);
    this.api.getData().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading.set(false);
      }
    });
  }
}
```

### Templates con Nueva Sintaxis Angular
```html
<!-- Condicionales -->
@if (loading()) {
  <div>Cargando...</div>
} @else {
  <div>Contenido</div>
}

<!-- Loops -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

<!-- RouterLink -->
<a routerLink="/cliente/dashboard">Dashboard</a>
```

### Estilos con Tailwind
```html
<div class="bg-white p-6 rounded-xl shadow-lg">
  <h1 class="text-2xl font-bold text-gray-800">Título</h1>
  <button class="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded-lg">
    Botón
  </button>
</div>
```

### Color Primary
```css
--color-primary: #FF3D3D;
```

---

## 11. Flujos Importantes

### Flujo de Registro de Cliente

```
Usuario completa formulario
    ↓
api.register({ rol: 'client', email, password })
    ↓
api.login(email, password) → { token, user }
    ↓
auth.login(token, user)
localStorage.setItem('festeasy_token', token)
localStorage.setItem('festeasy_user', JSON.stringify(user))
    ↓
api.createClientProfile({ nombre, telefono })
    ↓
window.location.href = '/cliente/dashboard'
    ↓
Página recarga → roleGuard lee localStorage
    ↓
✅ Acceso permitido al dashboard
```

### Flujo de Cotización de Proveedor

```
Proveedor ve solicitud pendiente
    ↓
Click en "Aceptar"
    ↓
window.prompt('Precio propuesto:')
    ↓
Validar precio > 0
    ↓
api.createQuote({
  solicitud_id,
  proveedor_usuario_id,
  precio_total_propuesto,
  estado: 'pendiente'
})
    ↓
api.updateRequestStatus(id, 'negociacion')
    ↓
Actualizar UI local
solicitudes.update(items => 
  items.map(s => s.id === id ? {...s, estado: 'negociacion'} : s)
)
    ↓
Mostrar mensaje de éxito
```

### Flujo de Protección de Rutas

```
Usuario intenta acceder a /cliente/dashboard
    ↓
roleGuard se activa
    ↓
Lee localStorage.getItem('festeasy_token')
    ↓
¿Token existe?
  NO → Redirige a /login
  SÍ → Continúa
    ↓
Lee localStorage.getItem('festeasy_user')
Parsea JSON
    ↓
¿user.rol === 'client'? (rol requerido de route.data)
  SÍ → ✅ Permite acceso
  NO → Redirige a dashboard del rol correcto
```

---

## 📌 Puntos Críticos para IA

### ⚠️ NUNCA hacer esto:
❌ Usar signals en guards:
```typescript
if (!authService.isLoggedIn()) // INCORRECTO
```

❌ Usar `router.navigate()` después de registro:
```typescript
this.router.navigate(['/dashboard']); // INCORRECTO
```

### ✅ SIEMPRE hacer esto:
✅ Leer localStorage directamente en guards:
```typescript
const token = localStorage.getItem('festeasy_token'); // CORRECTO
```

✅ Usar `window.location.href` después de registro:
```typescript
window.location.href = '/cliente/dashboard'; // CORRECTO
```

### Estructura de Archivos
- Componentes: `nombre/nombre.ts` + `nombre/nombre.html`
- Services: `services/nombre.service.ts`
- Guards: `guards/nombre.guard.ts`
- Models: `models/index.ts` (todos los interfaces)

### Variables de Entorno
**Ubicación**: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
ng serve                # Servidor de desarrollo en :4200
ng build                # Build para producción
ng generate component   # Crear componente

# Git
git add .
git commit -m "mensaje"
git push origin main
git pull origin main
```

---

**Última actualización**: 2026-01-16  
**Versión de Angular**: 17  
**Estado**: Producción activa

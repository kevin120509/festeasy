# 📊 RESUMEN EJECUTIVO - PROYECTO FESTEASY

**Última Actualización**: 18 de Enero 2026  
**Versión Angular**: 21.1.0  
**Estado**: En Desarrollo Activo

---

## 🎯 DESCRIPCIÓN DEL PROYECTO

**FestEasy** es una plataforma web que conecta **clientes** que organizan eventos con **proveedores** de servicios para eventos (mobiliario, catering, música, decoración, etc.).

### Problema que Resuelve
- Dificultad para encontrar proveedores de servicios confiables
- Falta de transparencia en precios y cotizaciones
- Comunicación ineficiente entre clientes y proveedores
- Necesidad de centralizar la gestión de eventos

### Solución
Marketplace digital con:
- Sistema de búsqueda y filtrado de proveedores
- Solicitudes de servicio y cotizaciones en línea
- Gestión de eventos para clientes
- Panel de control para proveedores
- Sistema de autenticación y roles

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico

#### Frontend
- **Framework**: Angular 17 (Standalone Components)
- **Lenguaje**: TypeScript 5.9.2
- **Estado Reactivo**: Angular Signals
- **Estilos**: Tailwind CSS + CSS Custom Properties
- **Routing**: Angular Router con Guards
- **HTTP**: HttpClient + RxJS 7.8

#### Características Técnicas
- ✅ Standalone Components (sin NgModules)
- ✅ Nueva sintaxis de control flow (@if, @for)
- ✅ Signals para estado reactivo
- ✅ Guards funcionales (CanActivateFn)
- ✅ Lazy Loading preparado
- ✅ Responsive Design

### Estructura de Carpetas

```
src/app/
├── cliente/              # Módulo de Cliente
│   ├── registro/         ✅ Implementado
│   ├── dashboard/        ✅ Implementado
│   ├── marketplace/      ✅ Implementado
│   ├── proveedor-detalle/ ✅ Implementado
│   ├── carrito/          ✅ Implementado
│   └── solicitudes/      🚧 Parcial
│
├── proveedor/            # Módulo de Proveedor
│   ├── registro/         ✅ Implementado
│   ├── dashboard/        ✅ Implementado
│   ├── solicitudes/      ✅ Implementado
│   ├── paquetes/         ✅ Implementado
│   ├── agenda/           ✅ Implementado
│   ├── notificaciones/   ✅ Implementado
│   └── configuracion/    ✅ Implementado
│
├── shared/               # Componentes Compartidos
│   ├── header/           ✅ Implementado
│   ├── landing/          ✅ Implementado
│   └── login/            ✅ Implementado
│
├── services/             # Servicios Globales
│   ├── api.service.ts    ✅ Completo
│   └── auth.service.ts   ✅ Completo
│
├── guards/               # Protección de Rutas
│   ├── auth.guard.ts     ✅ Implementado
│   └── role.guard.ts     ✅ Implementado
│
└── models/               # Interfaces TypeScript
    └── index.ts          ✅ Completo
```

---

## 👤 PANEL DE CLIENTE (Usuario)

### ✅ FUNCIONALIDADES IMPLEMENTADAS

#### 1. Autenticación y Registro
**Ruta**: `/cliente/registro`

**Características**:
- Formulario de registro multi-campo
- Validaciones en tiempo real
- Auto-login después de registro
- Creación automática de perfil
- Redirección a dashboard

**Campos**:
- Nombre completo
- Correo electrónico
- Teléfono (opcional)
- Contraseña

**Flujo**:
```
Registro → Login automático → Crear perfil → Dashboard
```

---

#### 2. Dashboard de Cliente
**Ruta**: `/cliente/dashboard`  
**Protección**: `roleGuard` (rol: 'client')

**Secciones Implementadas**:

##### 📅 Evento Activo
- Muestra el próximo evento del cliente
- Información del proveedor
- Fecha y ubicación
- Estado actual

##### 📊 Actividad Reciente
- Últimas 3 solicitudes enviadas
- Información resumida
- Estados visibles

##### 🎉 Mis Eventos (Grid Completo)
- **Tarjetas modernas** con:
  - Título del evento
  - Dirección del servicio
  - Fecha formateada
  - Badge de estado con colores:
    - 🟡 Amarillo: Pendiente Aprobación
    - 🔵 Azul: Negociación
    - 🟢 Verde: Reservado
    - 🔴 Rojo: Rechazada
- Click para ver detalles (próximamente)
- Link a crear nuevo evento

**Estadísticas**:
- Contador de eventos totales
- Filtros por estado
- Búsqueda de eventos

---

#### 3. Marketplace (Búsqueda de Proveedores)
**Ruta**: `/cliente/marketplace`  
**Protección**: `roleGuard` (rol: 'client')

**Funcionalidades**:

##### 🔍 Búsqueda
- Input de búsqueda en tiempo real
- Búsqueda por nombre de proveedor
- Búsqueda por categoría

##### 🎛️ Filtros
- Categoría (dropdown):
  - DJ / Sonido
  - Catering
  - Fotografía
  - Decoración
  - Iluminación
  - Pastelería
- Rango de precios (próximamente)
- Calificación mínima (próximamente)

##### 📋 Grid de Proveedores
Cada tarjeta muestra:
- Emoji/Avatar del proveedor
- Nombre del negocio
- Categoría
- Calificación (★★★★★)
- Precio desde
- Botón "Ver Detalles"

---

#### 4. Detalle de Proveedor
**Ruta**: `/cliente/proveedor/:id`  
**Protección**: `roleGuard` (rol: 'client')

**Secciones**:

##### 🎨 Hero Section
- Imagen grande del proveedor
- Efecto degradado rojo

##### 📝 Información Principal
- Nombre del negocio
- Categoría principal
- Ubicación (📍)
- Calificación promedio
- Número de reseñas
- Descripción completa del negocio

##### 📦 Paquetes/Servicios
Lista de paquetes con:
- Nombre del paquete
- Descripción
- Precio base
- Botón "Agregar al carrito"

##### 🖼️ Galería
- Grid 4x? de imágenes/emojis
- Trabajos anteriores del proveedor

##### ⭐ Reseñas
Cada reseña muestra:
- Nombre del autor
- Fecha de publicación
- Calificación en estrellas
- Comentario completo

##### 📋 Sidebar - Formulario de Solicitud
**FUNCIONALIDAD CLAVE**:

**Campos del formulario**:
- ✅ Nombre del evento (requerido)
- ✅ Fecha del evento (requerido)
- ✅ Dirección del evento (requerido)
- ✅ Mensaje adicional (opcional)

**Flujo de Solicitud**:
1. Cliente completa formulario
2. Click "🎉 Enviar Solicitud"
3. Sistema crea `ServiceRequest`:
   - `cliente_usuario_id`: ID del cliente
   - `proveedor_usuario_id`: ID del proveedor
   - `titulo_evento`, `fecha_servicio`, `direccion_servicio`
   - `estado`: `'pendiente_aprobacion'`
4. Redirección a `/cliente/dashboard`
5. Solicitud visible en "Mis Eventos"

**Validaciones**:
- Autenticación requerida
- Campos obligatorios verificados
- Mensajes de error en rojo
- Botón deshabilitado mientras envía

---

#### 5. Carrito de Servicios
**Ruta**: `/cliente/carrito`  
**Protección**: `roleGuard` (rol: 'client')

**Funcionalidades**:
- Lista de paquetes agregados
- Información del proveedor
- Cantidad ajustable
- Precio unitario
- Subtotal por item
- Resumen de costos:
  - Subtotal
  - Comisión (5%)
  - Impuestos (7%)
  - Total
- Botón "Eliminar" por item
- Proceso de checkout en 2 pasos

**Estados**:
1. Vista de Carrito
2. Vista de Checkout (revisión/pago)

---

### 🚧 PENDIENTES EN PANEL CLIENTE

1. **Detalle de Evento/Solicitud**
   - Ver información completa de un evento
   - Ver cotización del proveedor
   - Aceptar/Rechazar cotización
   - Estado de pagos

2. **Historial de Eventos**
   - Eventos completados
   - Calificar proveedores después del evento

3. **Perfil de Cliente**
   - Editar información personal
   - Cambiar contraseña
   - Preferencias

4. **Favoritos**
   - Guardar proveedores favoritos
   - Lista rápida de acceso

5. **Mensajería**
   - Chat con proveedores
   - Notificaciones en tiempo real

---

## 🏢 PANEL DE PROVEEDOR

### ✅ FUNCIONALIDADES IMPLEMENTADAS

#### 1. Registro de Proveedor
**Ruta**: `/proveedor/registro`

**Formulario Multi-step**:

**Paso 1 - Cuenta**:
- Correo electrónico
- Contraseña

**Paso 2 - Información del Negocio**:
- Nombre del negocio
- Categoría principal
- Descripción del negocio
- Teléfono de contacto

**Paso 3 - Ubicación**:
- Dirección completa
- Radio de cobertura (en km)
- Coordenadas (opcional)

**Flujo**:
```
Registro → Login automático → Crear perfil → Dashboard
```

---

#### 2. Dashboard de Proveedor
**Ruta**: `/proveedor/dashboard`  
**Protección**: `roleGuard` (rol: 'provider')

**Layout**:

##### 🎨 Sidebar de Navegación (Fija)
- 📊 Dashboard (activo)
- 📦 Paquetes
- 🔔 Solicitudes
- 💰 Cotizaciones
- 📅 Calendario
- 💳 Pagos
- ⚙️ Configuración

Características:
- Hover effects
- Íconos Material Icons
- Dark mode toggle
- Sticky positioning

##### 📈 Métricas (3 Cards)

**Card 1 - Nuevas Solicitudes**:
- Número total
- Porcentaje de cambio (verde)
- Ícono de mail

**Card 2 - Cotizaciones Activas**:
- Cantidad de cotizaciones pendientes
- Estado "Estable"
- Ícono de documento

**Card 3 - Ingresos Mensuales**:
- Monto en $MXN
- Porcentaje de cambio
- Ícono de pagos

##### 📋 Solicitudes Pendientes (Tabla)
Columnas:
- Cliente (con inicial en círculo)
- Evento (título)
- Fecha (formateada)
- Estado (badge con color)
- Acción (botón "Cotizar")

Muestra últimas 5 solicitudes

##### 💳 Pagos Recientes (Sidebar)
Lista con:
- Referencia del pago
- Monto
- Hora del pago
- Scroll personalizado

##### 🎯 Call-to-Action
Banner promocional para:
- Optimizar paquetes
- Mejorar visibilidad
- Gradiente rojo/rosa

---

#### 3. Gestión de Solicitudes
**Ruta**: `/proveedor/solicitudes`  
**Protección**: `roleGuard` (rol: 'provider')

**FUNCIONALIDAD ESTRELLA** ⭐

**Vista Principal**:
- Header con título "Solicitudes Recibidas"
- Badge con número de pendientes
- Grid responsive de tarjetas

**Cada Tarjeta de Solicitud Muestra**:
- Ícono de calendario
- Badge de estado:
  - 🟡 `pendiente_aprobacion`
  - 🔵 `negociacion`
  - 🟢 `reservado`
  - 🔴 `rechazada`
- Título del evento
- ID del cliente (parcial)
- Fecha del servicio (dd/MM/yyyy)
- Dirección completa
- **Botones de Acción**:
  - "✅ Aceptar" (verde)
  - "❌ Rechazar" (rojo)

**Flujo de Aceptación CON COTIZACIÓN**:

1. Proveedor click "Aceptar"
2. Aparece `window.prompt`:
   ```
   "Ingresa el precio total propuesto para este servicio:"
   ```
3. Proveedor ingresa precio (ej: 15000)
4. **Validaciones**:
   - ✅ Precio debe ser un número
   - ✅ Precio debe ser > 0
   - ❌ Si inválido: Mensaje de error rojo
5. Sistema ejecuta:
   ```typescript
   // 1. Crear cotización
   api.createQuote({
     solicitud_id: id,
     proveedor_usuario_id: currentUser.id,
     precio_total_propuesto: precio,
     estado: 'pendiente'
   })
   
   // 2. Actualizar solicitud
   api.updateRequestStatus(id, 'reservado')
   ```
6. **UI Updates**:
   - Badge cambia a azul "RESERVADO"
   - Mensaje de éxito verde: "✅ Cotización enviada exitosamente"
   - Mensaje se oculta después de 3 segundos
   - Solicitud actualizada en la lista

**Flujo de Rechazo**:
1. Proveedor click "Rechazar"
2. Actualiza estado a `'rechazada'`
3. Solicitud se elimina de la lista
4. No hay vuelta atrás

**Mensajes de Feedback**:
- ✅ Verde (éxito): "Cotización enviada exitosamente"
- ❌ Rojo (error): "Error al crear la cotización"
- 🔴 Rojo (validación): "Por favor ingresa un precio válido"

**Animaciones**:
- Slide-in para notificaciones
- Hover effects en cards
- Transitions suaves

---

#### 4. Gestión de Paquetes
**Ruta**: `/proveedor/paquetes`  
**Protección**: `roleGuard` (rol: 'provider')

**Funcionalidades**:

##### Header
- Título "Mis Paquetes de Servicios"
- Botón "+ Crear Nuevo Paquete"
- Descripción de beneficios

##### Vista de Onboarding
Si no hay paquetes:
- Emoji grande 📦
- Mensaje explicativo
- Botón CTA destacado

##### Grid de Paquetes
Cada tarjeta muestra:
- Imagen del paquete (si existe)
- Nombre del paquete
- Descripción
- Precio base en grande
- Toggle Activo/Inactivo
- Badge de categoría
- Botones:
  - ✏️ Editar
  - 🗑️ Eliminar

##### Modal de Creación/Edición
Campos:
- Nombre del paquete
- Descripción detallada
- Precio base
- Items incluidos (JSON)
- Upload de imagen
- Toggle activo/inactivo
- Categoría

**Estados**:
- Creación: Formulario vacío
- Edición: Pre-llenado con datos

---

#### 5. Calendario/Agenda
**Ruta**: `/proveedor/agenda`  
**Protección**: `roleGuard` (rol: 'provider')

**Funcionalidades**:
- Vista calendario mensual
- Eventos confirmados marcados
- Click en día → ver eventos
- Filtros por estado
- Navegación mes/año
- Vista de lista alternativa

---

#### 6. Notificaciones
**Ruta**: `/proveedor/notificaciones`  
**Protección**: `roleGuard` (rol: 'provider')

**Tipos de Notificaciones**:
- 🔔 Nueva solicitud recibida
- ✅ Cliente aceptó cotización
- ❌ Cliente rechazó cotización
- 💰 Pago recibido
- ⭐ Nueva reseña

**Features**:
- Mark as read/unread
- Filtros por tipo
- Ordenar por fecha
- Badge de contador

---

#### 7. Configuración de Perfil
**Ruta**: `/proveedor/configuracion`  
**Protección**: `roleGuard` (rol: 'provider')

**Secciones**:

##### 📷 Foto de Perfil
- Avatar circular actual
- Botón "Cambiar Foto"
- Upload de imagen
- Vista previa
- Formatos: JPG, PNG, GIF
- Tamaño máx: 2MB

##### 🏢 Información del Negocio
- Nombre del negocio (editable)
- Descripción completa (textarea)
- Teléfono de contacto

##### 📍 Ubicación y Cobertura
- Dirección (texto)
- Radio de cobertura (slider):
  - Min: 1 km
  - Max: 100 km
  - Valor en tiempo real
  - Badge con número

##### 💾 Acciones
- Botón "Cancelar" → volver a dashboard
- Botón "Guardar Cambios" → actualizar perfil
  - Loading state
  - Mensaje de éxito
  - Redirección

---

### 🚧 PENDIENTES EN PANEL PROVEEDOR

1. **Gestión de Cotizaciones**
   - Lista de todas las cotizaciones enviadas
   - Estados: Pendiente, Aceptada, Rechazada
   - Editar cotización pendiente
   - Ver respuesta del cliente

2. **Módulo de Pagos**
   - Historial completo de pagos
   - Pagos pendientes
   - Métodos de cobro
   - Reportes de ingresos

3. **Análisis y Reportes**
   - Gráficas de ventas
   - Estadísticas mensuales/anuales
   - Eventos más rentables
   - Exportar datos

4. **Mensajería**
   - Chat con clientes
   - Historial de conversaciones
   - Notificaciones en tiempo real

5. **Galería de Trabajos**
   - Upload de fotos de eventos
   - Organizar por categoría
   - Vista pública en perfil

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Implementación

**Enfoque**: localStorage como fuente única de verdad

#### AuthService
Gestiona:
- Login/Logout
- Estado de autenticación (signals)
- Rol del usuario
- Token JWT
- Información del usuario

**Métodos principales**:
```typescript
login(token: string, user: any)
logout()
getToken(): string | null
isLoggedIn(): boolean
currentUser(): User | null
getUserRole(): string
```

#### Guards

**authGuard** (Autenticación simple):
```typescript
// Verifica si existe token en localStorage
const token = localStorage.getItem('festeasy_token');
return !!token;
```

**roleGuard** (Por rol):
```typescript
// Lee token y user de localStorage
// Verifica rol contra route.data['role']
// Redirige a dashboard correcto si rol no coincide
```

**Protección de Rutas**:
- ✅ Todas las rutas de cliente protegidas con `roleGuard`
- ✅ Todas las rutas de proveedor protegidas con `roleGuard`
- ✅ Rutas públicas: Landing, Login, Registros

**Persistencia de Sesión**:
- Token guardado en `localStorage.festeasy_token`
- User guardado en `localStorage.festeasy_user`
- Sobrevive a recargas de página
- Logout limpia ambos

---

## 📡 INTEGRACIÓN CON BACKEND (ApiService)

### Endpoints Implementados

#### Autenticación
```typescript
login(email, password): Observable<{token, user}>
register(userData): Observable<User>
```

#### Usuarios
```typescript
getUser(id): Observable<User>
updateUser(id, data): Observable<User>
```

#### Perfiles
```typescript
createClientProfile(data): Observable<ClientProfile>
createProviderProfile(data): Observable<ProviderProfile>
getProviderProfile(userId): Observable<ProviderProfile>
updateProviderProfile(userId, data): Observable<ProviderProfile>
```

#### Solicitudes de Servicio
```typescript
getClientRequests(): Observable<ServiceRequest[]>
getProviderRequests(): Observable<ServiceRequest[]>
createRequest(data): Observable<ServiceRequest>
updateRequestStatus(id, status): Observable<ServiceRequest>
```

#### Cotizaciones
```typescript
createQuote(data): Observable<Quote>
getQuotes(): Observable<Quote[]>
updateQuote(id, data): Observable<Quote>
```

#### Paquetes
```typescript
getProviderPackages(): Observable<ProviderPackage[]>
createPackage(data): Observable<ProviderPackage>
updatePackage(id, data): Observable<ProviderPackage>
deletePackage(id): Observable<void>
```

#### Otros
```typescript
getReviews(providerId): Observable<Review[]>
getCart(): Observable<Cart>
deleteCartItem(id): Observable<void>
```

### Headers Con Autenticación
```typescript
private getHeaders(): HttpHeaders {
  const token = localStorage.getItem('festeasy_token');
  return new HttpHeaders({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });
}
```

---

## 📊 MODELOS DE DATOS

### User
```typescript
interface User {
  id: string;
  correo_electronico: string;
  rol: 'client' | 'provider';
  creado_en: string;
}
```

### ClientProfile
```typescript
interface ClientProfile {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  telefono?: string;
  avatar_url?: string;
}
```

### ProviderProfile
```typescript
interface ProviderProfile {
  id: string;
  usuario_id: string;
  nombre_negocio: string;
  descripcion?: string;
  telefono?: string;
  direccion_formato?: string;
  radio_cobertura_km?: number;
  categoria_servicio?: string;
  avatar_url?: string;
  calificacion_promedio?: number;
}
```

### ServiceRequest
```typescript
interface ServiceRequest {
  id: string;
  numero_solicitud: number;
  cliente_usuario_id: string;
  proveedor_usuario_id: string;
  fecha_servicio: string;
  direccion_servicio: string;
  titulo_evento?: string;
  estado: 'pendiente_aprobacion' | 'negociacion' | 'reservado' | 'rechazada' | 'completada' | 'cancelada';
  creado_en: string;
}
```

### Quote
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

### ProviderPackage
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

## 🎨 DISEÑO Y UX

### Sistema de Diseño

#### Colores
```css
--color-primary: #FF3D3D;        /* Rojo principal */
--color-primary-dark: #E53935;   /* Rojo oscuro */
--color-white: #FFFFFF;
--color-gray: #6B7280;
--color-gray-light: #F9FAFB;
--color-gray-border: #E5E7EB;
```

#### Tipografía
- Font-family: System fonts (sin importar Google Fonts)
- Tamaños: 12px, 14px, 16px, 18px, 20px, 24px, 32px
- Pesos: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

#### Espaciado
- Basado en múltiplos de 4px
- Padding: 8px, 12px, 16px, 20px, 24px, 32px
- Margin: Similar

#### Border Radius
- Small: 8px
- Medium: 12px
- Large: 16px
- Full: 9999px (circular)

#### Shadows
```css
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

### Componentes Reutilizables

#### Badges de Estado
```html
<span class="badge bg-yellow-100 text-yellow-700">
  Pendiente
</span>
```

Colores por estado:
- 🟡 Amarillo: Pendiente
- 🔵 Azul: Negociación
- 🟢 Verde: Aprobado/Reservado
- 🔴 Rojo: Rechazado

#### Botones
- **Primary**: Fondo rojo (#FF3D3D)
- **Secondary**: Fondo gris
- **Outline**: Border con hover
- **Icon**: Solo ícono

Estados:
- Normal
- Hover (más oscuro)
- Active (presionado)
- Disabled (opacidad 50%)

#### Cards
```css
background: white;
border-radius: 16px;
box-shadow: soft;
padding: 24px;
```

Con hover effect:
```css
transform: translateY(-4px);
box-shadow: medium;
```

---

## 📈 ESTADÍSTICAS DEL PROYECTO

### Líneas de Código (Aproximado)
- TypeScript: ~8,000 líneas
- HTML: ~6,000 líneas
- CSS: ~3,000 líneas
- **Total**: ~17,000 líneas

### Archivos
- Componentes: 25+
- Servicios: 2
- Guards: 2
- Modelos: 15+ interfaces
- Rutas: 20+

### Pantallas Implementadas
- ✅ Landing Page
- ✅ Login
- ✅ Registro Cliente
- ✅ Registro Proveedor
- ✅ Dashboard Cliente
- ✅ Marketplace
- ✅ Detalle Proveedor
- ✅ Carrito
- ✅ Dashboard Proveedor
- ✅ Solicitudes Proveedor
- ✅ Paquetes Proveedor
- ✅ Agenda Proveedor
- ✅ Notificaciones Proveedor
- ✅ Configuración Proveedor

**Total**: 14 pantallas completas

---

## 🚀 PRÓXIMOS DESARROLLOS

### Prioridad Alta
1. **Sistema de Cotizaciones Completo**
   - Vista de cotizaciones para cliente
   - Aceptar/rechazar cotización
   - Historial de cotizaciones

2. **Detalle de Evento/Solicitud**
   - Ver información completa
   - Timeline de estados
   - Documentos adjuntos

3. **Sistema de Pagos**
   - Integración con pasarela
   - Método de pago
   - Comprobantes

### Prioridad Media
4. **Mensajería en Tiempo Real**
   - Chat cliente-proveedor
   - Notificaciones push
   - Historial de mensajes

5. **Sistema de Reseñas**
   - Calificar proveedor después del evento
   - Sistema de estrellas
   - Comentarios públicos

6. **Perfil Público de Proveedor**
   - URL personalizada
   - Galería de trabajos
   - Portfolio

### Prioridad Baja
7. **Análisis y Reportes**
   - Dashboard de analytics
   - Exportar datos
   - Gráficas interactivas

8. **Configuración Avanzada**
   - Preferencias de notificaciones
   - Privacidad
   - Facturación

---

## 🐛 BUGS CONOCIDOS Y FIXES RECIENTES

### ✅ Corregidos
- ✅ Persistencia de sesión después de refresh
- ✅ Redirección incorrecta después de registro
- ✅ Estado 'aceptada' → 'reservado' (TS2367)
- ✅ Conflictos de versión Angular 20 → 21
- ✅ Guards leyendo signals desactualizados
- ✅ Sidebar con href="#" en lugar de routerLink

### 🚧 Por Resolver
- ⚠️ Validación de formularios más robusta
- ⚠️ Manejo de errores de red
- ⚠️ Loading states globales
- ⚠️ Paginación en listas largas

---

## 📝 CONVENCIONES Y MEJORES PRÁCTICAS

### Naming
- **Componentes**: PascalCase (`DashboardComponent`)
- **Variables**: camelCase (`currentUser`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Archivos**: kebab-case (`auth.service.ts`)

### Signals
```typescript
// Estado reactivo con signals
const data = signal<Type[]>([]);

// Actualizar
data.set(newValue);
data.update(prev => [...prev, newItem]);

// Leer
const value = data();
```

### Guards
```typescript
// SIEMPRE leer de localStorage directamente
const token = localStorage.getItem('festeasy_token');

// NUNCA depender de signals en guards
// ❌ if (!authService.isLoggedIn())
// ✅ if (!token)
```

### Navegación Post-Registro
```typescript
// Usar window.location.href para forzar recarga
window.location.href = '/cliente/dashboard';

// router.navigate() solo cuando ya hay sesión activa
this.router.navigate(['/dashboard']);
```

---

## 🎓 DOCUMENTACIÓN DISPONIBLE

1. **GUIA_PROYECTO.md**
   - Arquitectura completa
   - Servicios y modelos
   - Convenciones de código
   - Flujos críticos

2. **FLUJOS_COMPLETOS.md**
   - Mapas de navegación
   - Todos los flujos de usuario
   - Pantallas faltantes
   - Mapa de sitio

3. **walkthrough.md** (Artifacts)
   - Cambios recientes
   - Soluciones implementadas
   - Pruebas realizadas

---

## 📞 CONTACTO Y EQUIPO

### Desarrolladores
- Frontend: Angular 17 + TypeScript
- Backend: PHP/Node.js (separado)
- Diseño: Tailwind CSS

### Repositorio
- GitHub: VictorCD20/festeasy-web-v1

---

**Este documento resume el estado completo del proyecto FestEasy al 18 de Enero de 2026.**

**Versión del documento**: 1.0  
**Próxima revisión**: A medida que se implementen nuevas features

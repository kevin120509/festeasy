# 🎉 FestEasy - Flujos Completos y Pantallas de la Aplicación

## 📊 Mapa de Navegación General

```
LANDING PAGE
    ↓
    ├─→ LOGIN → (Cliente Dashboard / Proveedor Dashboard)
    ├─→ REGISTRO CLIENTE → LOGIN → Cliente Dashboard
    └─→ REGISTRO PROVEEDOR → LOGIN → Proveedor Dashboard
```

---

## 🎯 FLUJO COMPLETO - CLIENTE

### 1. **Landing Page** 
**Ruta**: `/`  
**Componente**: `LandingComponent`

**Elementos:**
- Hero section con descripción de FestEasy
- Botones: "Registrarse", "Iniciar Sesión"
- Secciones: Cómo funciona, Beneficios, Categorías
- Footer con enlaces

**Navegación:**
- → `/cliente/registro` (Registrarse como Cliente)
- → `/proveedor/registro` (Registrarse como Proveedor)
- → `/login` (Iniciar Sesión)

---

### 2. **Registro de Cliente**
**Ruta**: `/cliente/registro`  
**Componente**: `ClienteRegistroComponent`

**Formulario:**
- Nombre completo
- Correo electrónico
- Teléfono (opcional)
- Contraseña

**Flujo:**
1. Usuario completa formulario
2. Click "Registrarme como Cliente"
3. Sistema crea usuario con `rol: 'client'`
4. Auto-login
5. Crea perfil de cliente
6. Redirige a `/cliente/dashboard`

**Navegación:**
- → `/login` (Ya tienes cuenta)
- → `/proveedor/registro` (Soy proveedor)
- → `/cliente/dashboard` (después de registro exitoso)

---

### 3. **Login**
**Ruta**: `/login`  
**Componente**: `LoginComponent`

**Formulario:**
- Correo electrónico
- Contraseña

**Flujo:**
1. Ingresa credenciales
2. Sistema valida
3. Redirige según rol:
   - Cliente → `/cliente/dashboard`
   - Proveedor → `/proveedor/dashboard`

**Navegación:**
- → `/cliente/registro` (Registrarse como cliente)
- → `/proveedor/registro` (Registrarse como proveedor)

---

### 4. **Dashboard de Cliente**
**Ruta**: `/cliente/dashboard`  
**Componente**: `ClienteDashboardComponent`  
**Protección**: `roleGuard` (rol: 'client')

**Secciones:**
- **Header**: Nombre del cliente, notificaciones, logout
- **Evento Activo**: Próximo evento con detalles
- **Actividad Reciente**: Últimas solicitudes enviadas
- **Mis Eventos**: Grid con todas las solicitudes
  - Título del evento
  - Dirección
  - Fecha
  - Estado (pendiente, negociación, aceptada)

**Navegación:**
- → `/cliente/marketplace` (Buscar proveedores)
- → `/cliente/carrito` (Ver carrito)
- → `/cliente/solicitudes` (Nueva solicitud)

---

### 5. **Marketplace (Búsqueda de Proveedores)**
**Ruta**: `/cliente/marketplace`  
**Componente**: `MarketplaceComponent`  
**Protección**: `roleGuard` (rol: 'client')

**Elementos:**
- **Buscador**: Por nombre, categoría, ubicación
- **Filtros**: 
  - Categoría (Música, Mobiliario, Catering, etc.)
  - Rango de precios
  - Calificación mínima
  - Radio de cobertura
- **Grid de Proveedores**:
  - Foto/avatar
  - Nombre del negocio
  - Categoría
  - Calificación (★★★★★)
  - Precio desde
  - Botón "Ver Detalles"

**Navegación:**
- → `/cliente/proveedor/:id` (Ver detalle de proveedor)
- → `/cliente/dashboard` (Volver al dashboard)

---

### 6. **Detalle de Proveedor**
**Ruta**: `/cliente/proveedor/:id`  
**Componente**: `ProveedorDetalleComponent`  
**Protección**: `roleGuard` (rol: 'client')

**Secciones:**
- **Hero**: Imagen/emoji grande del proveedor
- **Información Principal**:
  - Nombre del negocio
  - Categoría
  - Ubicación
  - Calificación y número de reseñas
  - Descripción completa
- **Paquetes/Servicios**:
  - Lista de paquetes ofrecidos
  - Precio de cada paquete
  - Descripción
  - Botón "Agregar al carrito"
- **Galería**: Fotos de trabajos anteriores
- **Reseñas**: Comentarios de otros clientes
- **Sidebar - Formulario de Solicitud**:
  - Nombre del evento
  - Fecha del evento
  - Dirección
  - Mensaje adicional
  - Botón "Enviar Solicitud"

**Flujo de Solicitud:**
1. Cliente completa formulario
2. Click "Enviar Solicitud"
3. Sistema crea `ServiceRequest` con estado `'pendiente_aprobacion'`
4. Redirige a `/cliente/dashboard`
5. Cliente ve su nueva solicitud en "Mis Eventos"

**Navegación:**
- → `/cliente/marketplace` (Volver a búsqueda)
- → `/cliente/dashboard` (después de enviar solicitud)
- → `/cliente/carrito` (Ver carrito)

---

### 7. **Carrito de Servicios**
**Ruta**: `/cliente/carrito`  
**Componente**: `CarritoComponent`  
**Protección**: `roleGuard` (rol: 'client')

**Elementos:**
- Lista de paquetes agregados
- Proveedores seleccionados
- Subtotales
- Total general
- Botón "Proceder al pago" o "Solicitar cotización"

**Navegación:**
- → `/cliente/marketplace` (Seguir comprando)
- → `/cliente/dashboard` (Volver al dashboard)

---

### 8. **Nueva Solicitud (Standalone)**
**Ruta**: `/cliente/solicitudes`  
**Componente**: `CrearSolicitudComponent`  
**Protección**: `roleGuard` (rol: 'client')

**Formulario:**
- Seleccionar proveedor (dropdown)
- Título del evento
- Fecha del servicio
- Dirección
- Detalles adicionales

**Navegación:**
- → `/cliente/dashboard` (después de crear)

---

## 🏢 FLUJO COMPLETO - PROVEEDOR

### 1. **Registro de Proveedor**
**Ruta**: `/proveedor/registro`  
**Componente**: `ProveedorRegistroComponent`

**Formulario (Multi-step):**
- **Paso 1 - Cuenta**:
  - Correo electrónico
  - Contraseña
- **Paso 2 - Negocio**:
  - Nombre del negocio
  - Categoría principal
  - Descripción
  - Teléfono
- **Paso 3 - Ubicación**:
  - Dirección
  - Radio de cobertura (km)

**Flujo:**
1. Completa todos los pasos
2. Sistema crea usuario con `rol: 'provider'`
3. Auto-login
4. Crea perfil de proveedor
5. Redirige a `/proveedor/dashboard`

**Navegación:**
- → `/login` (Ya tienes cuenta)
- → `/cliente/registro` (Soy cliente)
- → `/proveedor/dashboard` (después de registro)

---

### 2. **Dashboard de Proveedor**
**Ruta**: `/proveedor/dashboard`  
**Componente**: `ProveedorDashboardComponent`  
**Protección**: `roleGuard` (rol: 'provider')

**Sidebar de Navegación:**
- 📊 Dashboard (activo)
- 📦 Paquetes
- 🔔 Solicitudes
- 💰 Cotizaciones
- 📅 Calendario
- 💳 Pagos
- ⚙️ Configuración

**Contenido Principal:**
- **Header**: 
  - Nombre del negocio
  - Avatar
  - Notificaciones
  - Toggle dark mode
- **Métricas (Cards)**:
  - Nuevas Solicitudes (con % de cambio)
  - Cotizaciones Activas
  - Ingresos Mensuales (con % de cambio)
- **Solicitudes Pendientes** (Tabla):
  - Cliente
  - Evento
  - Fecha
  - Estado
  - Botón "Cotizar"
- **Pagos Recientes** (Lista):
  - Referencia
  - Monto
  - Fecha/hora
- **Call-to-Action**: Optimizar paquetes

**Navegación:**
- → `/proveedor/solicitudes` (Ver todas las solicitudes)
- → `/proveedor/paquetes` (Gestionar paquetes)
- → `/proveedor/configuracion` (Configurar perfil)

---

### 3. **Solicitudes Recibidas**
**Ruta**: `/proveedor/solicitudes`  
**Componente**: `SolicitudesComponent`  
**Protección**: `roleGuard` (rol: 'provider')

**Elementos:**
- **Header**: 
  - Título "Solicitudes Recibidas"
  - Badge con número de pendientes
- **Lista de Solicitudes** (Cards):
  - Título del evento
  - Cliente (ID parcial)
  - Fecha del servicio
  - Dirección
  - Estado (badge con color)
  - Botones de acción:
    - "Aceptar" (si pendiente)
    - "Rechazar" (si pendiente)

**Flujo de Aceptación:**
1. Proveedor click "Aceptar"
2. Aparece `window.prompt` pidiendo precio
3. Proveedor ingresa precio
4. Sistema crea `Quote` con:
   - `precio_total_propuesto`
   - `estado: 'pendiente'`
5. Actualiza solicitud a `estado: 'negociacion'`
6. Muestra mensaje de éxito (verde, 3 seg)
7. Badge cambia a azul "NEGOCIACIÓN"

**Flujo de Rechazo:**
1. Proveedor click "Rechazar"
2. Actualiza solicitud a `estado: 'rechazada'`
3. Solicitud desaparece de la lista

**Navegación:**
- → `/proveedor/dashboard` (Volver al dashboard)

---

### 4. **Gestión de Paquetes**
**Ruta**: `/proveedor/paquetes`  
**Componente**: `PaquetesComponent`  
**Protección**: `roleGuard` (rol: 'provider')

**Elementos:**
- **Header**:
  - Título "Mis Paquetes de Servicios"
  - Botón "+ Crear Nuevo Paquete"
- **Grid de Paquetes**:
  - Imagen del paquete
  - Nombre
  - Descripción
  - Precio base
  - Estado (Activo/Inactivo)
  - Botones: "Editar", "Eliminar"
- **Modal de Creación/Edición**:
  - Nombre del paquete
  - Descripción
  - Precio base
  - Items incluidos
  - Imagen (upload)
  - Toggle activo/inactivo

**Navegación:**
- → `/proveedor/dashboard` (Volver)

---

### 5. **Cotizaciones**
**Ruta**: `/proveedor/cotizaciones`  
**Componente**: `CotizacionesComponent` (por implementar)  
**Protección**: `roleGuard` (rol: 'provider')

**Elementos:**
- Lista de cotizaciones enviadas
- Estado: Pendiente, Aceptada, Rechazada
- Detalles de la solicitud asociada
- Precio propuesto
- Posibilidad de editar cotización pendiente

**Navegación:**
- → `/proveedor/dashboard`

---

### 6. **Calendario/Agenda**
**Ruta**: `/proveedor/agenda`  
**Componente**: `AgendaComponent`  
**Protección**: `roleGuard` (rol: 'provider')

**Elementos:**
- Vista calendario mensual
- Eventos confirmados marcados
- Al click: Detalles del evento
- Filtros por estado

**Navegación:**
- → `/proveedor/dashboard`

---

### 7. **Notificaciones**
**Ruta**: `/proveedor/notificaciones`  
**Componente**: `NotificacionesComponent`  
**Protección**: `roleGuard` (rol: 'provider')

**Elementos:**
- Lista de notificaciones
- Tipos:
  - Nueva solicitud
  - Cliente aceptó cotización
  - Cliente rechazó cotización
  - Pago recibido
- Marcar como leída

**Navegación:**
- → `/proveedor/dashboard`

---

### 8. **Pagos**
**Ruta**: `/proveedor/pagos`  
**Componente**: `PagosComponent` (por implementar)  
**Protección**: `roleGuard` (rol: 'provider')

**Elementos:**
- Historial de pagos
- Pagos pendientes
- Métodos de pago
- Estadísticas de ingresos

**Navegación:**
- → `/proveedor/dashboard`

---

### 9. **Configuración de Perfil**
**Ruta**: `/proveedor/configuracion`  
**Componente**: `ProveedorConfiguracionComponent`  
**Protección**: `roleGuard` (rol: 'provider')

**Secciones:**
- **Foto de Perfil**:
  - Avatar actual
  - Botón "Cambiar Foto"
  - Upload de imagen
- **Información del Negocio**:
  - Nombre del negocio
  - Descripción
  - Teléfono
- **Ubicación y Cobertura**:
  - Dirección
  - Radio de cobertura (slider en km)
- **Botones**:
  - "Cancelar" → volver a dashboard
  - "Guardar Cambios" → actualizar perfil

**Navegación:**
- → `/proveedor/dashboard` (Cancelar o después de guardar)

---

## 🔄 FLUJOS COMPLETOS DE INTERACCIÓN

### Flujo 1: Cliente Solicita Servicio

```
1. LANDING PAGE
   ↓ Click "Registrarse"
2. REGISTRO CLIENTE
   ↓ Completa formulario
3. AUTO-LOGIN
   ↓ 
4. DASHBOARD CLIENTE
   ↓ Click "Buscar Proveedores"
5. MARKETPLACE
   ↓ Busca/filtra proveedores
   ↓ Click "Ver Detalles"
6. DETALLE PROVEEDOR
   ↓ Completa formulario solicitud
   ↓ Click "Enviar Solicitud"
7. DASHBOARD CLIENTE
   ✅ Ve su solicitud en "Mis Eventos"
   Estado: "Pendiente Aprobación"
```

---

### Flujo 2: Proveedor Responde con Cotización

```
1. PROVEEDOR DASHBOARD
   ✉️ Notificación: Nueva solicitud
   ↓ Click "Ver Solicitudes"
2. SOLICITUDES RECIBIDAS
   ↓ Ve solicitud pendiente
   ↓ Click "Aceptar"
3. PROMPT: Ingresa precio
   ↓ Ingresa $15,000
4. SISTEMA:
   - Crea Cotización
   - Actualiza estado → "Negociación"
5. SOLICITUDES RECIBIDAS
   ✅ Mensaje: "Cotización enviada"
   Badge cambia a azul "NEGOCIACIÓN"
```

---

### Flujo 3: Cliente Revisa y Acepta Cotización

```
1. DASHBOARD CLIENTE
   ↓ Ve solicitud con estado "Negociación"
   ↓ Click en la tarjeta del evento
2. DETALLE DE SOLICITUD (por implementar)
   ↓ Ve cotización del proveedor
   ↓ Precio: $15,000
   ↓ Click "Aceptar Cotización"
3. SISTEMA:
   - Actualiza cotización → "Aceptada"
   - Actualiza solicitud → "Aceptada"
   - Crea evento en calendario
4. DASHBOARD CLIENTE
   ✅ Estado cambia a "Aceptada"
   🎉 Evento confirmado
```

---

## 📱 PANTALLAS FALTANTES (Por Implementar)

### Cliente:
1. **Detalle de Solicitud/Evento**
   - `/cliente/evento/:id`
   - Ver detalles completos
   - Ver cotización del proveedor
   - Aceptar/Rechazar cotización
   - Chat con proveedor

2. **Historial de Eventos**
   - `/cliente/historial`
   - Eventos completados
   - Calificar proveedores

3. **Perfil de Cliente**
   - `/cliente/perfil`
   - Editar información
   - Cambiar contraseña

4. **Favoritos**
   - `/cliente/favoritos`
   - Proveedores guardados

### Proveedor:
1. **Detalle de Cotización**
   - `/proveedor/cotizacion/:id`
   - Editar cotización
   - Ver respuesta del cliente

2. **Análisis/Reportes**
   - `/proveedor/reportes`
   - Estadísticas de ventas
   - Gráficas de ingresos

3. **Chat con Clientes**
   - `/proveedor/mensajes`
   - Comunicación directa

### Compartidas:
1. **Recuperar Contraseña**
   - `/recuperar-password`
   - Formulario de email
   - Página de reset

2. **Términos y Condiciones**
   - `/terminos`

3. **Política de Privacidad**
   - `/privacidad`

4. **Ayuda/FAQ**
   - `/ayuda`

---

## 🎨 RESUMEN TOTAL DE PANTALLAS

### ✅ Implementadas (13):
1. Landing Page
2. Login
3. Registro Cliente
4. Registro Proveedor
5. Dashboard Cliente
6. Marketplace
7. Detalle Proveedor
8. Carrito
9. Dashboard Proveedor
10. Solicitudes Proveedor
11. Paquetes Proveedor
12. Agenda Proveedor
13. Configuración Proveedor

### 🚧 Por Implementar (11+):
14. Detalle de Evento/Solicitud (Cliente)
15. Historial (Cliente)
16. Perfil Cliente
17. Favoritos (Cliente)
18. Cotizaciones (Proveedor)
19. Notificaciones (Proveedor)
20. Pagos (Proveedor)
21. Detalle de Cotización (Proveedor)
22. Reportes (Proveedor)
23. Mensajes/Chat (Ambos)
24. Recuperar Password
25. Términos, Privacidad, Ayuda

**TOTAL ESTIMADO**: ~25 pantallas completas

---

## 🗺️ Mapa de Sitio Completo

```
/
├── login
├── cliente/
│   ├── registro
│   ├── dashboard ✅
│   ├── marketplace ✅
│   ├── proveedor/:id ✅
│   ├── carrito ✅
│   ├── solicitudes
│   ├── evento/:id (por implementar)
│   ├── historial (por implementar)
│   ├── perfil (por implementar)
│   └── favoritos (por implementar)
│
├── proveedor/
│   ├── registro
│   ├── dashboard ✅
│   ├── solicitudes ✅
│   ├── paquetes ✅
│   ├── cotizaciones (por implementar)
│   ├── agenda ✅
│   ├── notificaciones (por implementar)
│   ├── pagos (por implementar)
│   ├── configuracion ✅
│   ├── cotizacion/:id (por implementar)
│   ├── reportes (por implementar)
│   └── mensajes (por implementar)
│
└── shared/
    ├── recuperar-password (por implementar)
    ├── terminos (por implementar)
    ├── privacidad (por implementar)
    └── ayuda (por implementar)
```

---

Esta es la estructura completa de FestEasy! 🎉

# Documentación del Proyecto Festeasy

## 📋 Descripción General

Festeasy es una plataforma web desarrollada en Angular 21 que conecta a clientes con proveedores de servicios para eventos. La aplicación permite a los clientes crear solicitudes de eventos, buscar proveedores, gestionar carritos de compras y dar seguimiento a sus solicitudes. Por otro lado, los proveedores pueden gestionar sus paquetes de servicios, recibir solicitudes, cotizar y administrar su agenda.

## 🏗️ Arquitectura del Proyecto

### Estructura Principal
- **Frontend**: Angular 21 con TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS y PrimeNG
- **Estado**: Signals de Angular (para gestión reactiva)

### Organización de Carpetas
```
src/
├── app/
│   ├── admin/           # Módulo de administrador
│   ├── cliente/         # Módulo de clientes
│   ├── proveedor/       # Módulo de proveedores
│   ├── shared/          # Componentes compartidos
│   ├── services/        # Servicios de API y lógica
│   ├── models/          # Interfaces y tipos de datos
│   └── guards/          # Guards de rutas
├── assets/              # Imágenes y recursos estáticos
└── environments/        # Configuración de entornos
```

## 🔄 Flujo Principal del Sistema

### 1. Registro y Autenticación
- **Registro**: Usuarios pueden registrarse como clientes o proveedores
- **Login**: Sistema de autenticación mediante Supabase Auth
- **Roles**: Tres roles principales - `client`, `provider`, `admin`
- **Guards**: Protección de rutas según el rol del usuario

### 2. Flujo de Cliente (Proceso de Solicitud)

#### Paso 1: Creación de Evento
- **Componente**: `CrearEventoComponent` (`src/app/cliente/crear-evento/`)
- **Funcionalidad**:
  - Formulario para datos del evento (título, fecha, hora, ubicación, invitados)
  - Opción de usar geolocalización automática
  - Guardado temporal en `sessionStorage`
  - Redirección al marketplace

#### Paso 2: Búsqueda de Proveedores
- **Componente**: `MarketplaceComponent` (`src/app/cliente/marketplace/`)
- **Funcionalidad**:
  - Listado de proveedores con filtros por categoría y ubicación
  - Visualización de paquetes de servicios
  - Sistema de calificación y reseñas
  - Agregar paquetes al carrito

#### Paso 3: Gestión del Carrito
- **Componente**: `CarritoComponent` (`src/app/cliente/carrito/`)
- **Funcionalidad**:
  - Visualización de paquetes seleccionados
  - Modificación de cantidades
  - Eliminación de items
  - Cálculo automático de totales

#### Paso 4: Revisión y Envío de Solicitud
- **Componente**: `RevisarSolicitudComponent` (`src/app/cliente/solicitudes/revisar/`)
- **Funcionalidad**:
  - Resumen completo del evento y paquetes seleccionados
  - Confirmación final
  - Creación de la solicitud en la base de datos
  - Generación de número de solicitud único

#### Paso 5: Seguimiento de Solicitud
- **Componente**: `SeguimientoEventoComponent` (`src/app/cliente/seguimiento/`)
- **Componente**: `MisSolicitudesComponent` (`src/app/cliente/solicitudes/`)
- **Funcionalidad**:
  - Listado de todas las solicitudes del cliente
  - Filtros por estado (pendientes, cotizando, contratadas, finalizadas)
  - Detalles de cada solicitud
  - Estados del flujo: `pendiente_aprobacion` → `esperando_anticipo` → `reservado` → `en_progreso` → `finalizado`

### 3. Flujo de Proveedor

#### Gestión de Perfil
- **Componente**: `ProveedorConfiguracionComponent` (`src/app/proveedor/configuracion/`)
- **Funcionalidad**:
  - Edición de información del negocio
  - Gestión de cobertura geográfica
  - Configuración de datos bancarios

#### Gestión de Paquetes
- **Componente**: `PaquetesComponent` (`src/app/proveedor/paquetes/`)
- **Funcionalidad**:
  - Creación y edición de paquetes de servicios
  - Definición de precios y descripciones
  - Estado de publicación (`borrador`, `publicado`, `archivado`)

#### Gestión de Solicitudes
- **Componente**: `SolicitudesComponent` (`src/app/proveedor/solicitudes/`)
- **Componente**: `BandejaSolicitudesComponent` (`src/app/proveedor/bandeja-solicitudes/`)
- **Funcionalidad**:
  - Recepción de nuevas solicitudes
  - Aceptación o rechazo de solicitudes
  - Generación de cotizaciones
  - Gestión de pagos (anticipo y liquidación)

#### Gestión de Agenda
- **Componente**: `AgendaComponent` (`src/app/proveedor/agenda/`)
- **Funcionalidad**:
  - Bloqueo de fechas no disponibles
  - Visualización de eventos confirmados
  - Gestión de disponibilidad

## 🛠️ Servicios Principales

### ApiService (`src/app/services/api.service.ts`)
- **Propósito**: Comunicación con Supabase y gestión de datos
- **Funcionalidades**:
  - Autenticación (registro, login)
  - Gestión de perfiles (cliente y proveedor)
  - Operaciones CRUD para todas las entidades
  - Gestión de carritos y solicitudes
  - Manejo de errores y logging

### AuthService (`src/app/services/auth.service.ts`)
- **Propósito**: Gestión del estado de autenticación
- **Funcionalidades**:
  - Verificación de sesión activa
  - Gestión de tokens
  - Información del usuario actual

### SupabaseService (`src/app/services/supabase.service.ts`)
- **Propósito**: Cliente de Supabase
- **Funcionalidades**:
  - Configuración y conexión a Supabase
  - Gestión de cliente de base de datos

## 📊 Modelos de Datos

### Entidades Principales (`src/app/models/index.ts`)

#### User
- Información básica del usuario
- Roles y estados

#### ClientProfile / ProviderProfile
- Perfiles especializados según el rol
- Información de contacto y negocio

#### ServiceRequest (Solicitud)
- Corazón del sistema
- Estados del flujo de solicitud
- Relaciones con cliente y proveedor

#### ProviderPackage
- Paquetes de servicios ofrecidos
- Precios y categorías

#### Cart / CartItem
- Carrito de compras temporal
- Items seleccionados antes de convertir en solicitud

## 🔐 Seguridad y Autenticación

### Guards de Ruta
- **AuthGuard**: Verifica sesión activa
- **RoleGuard**: Verifica rol específico
- **AdminGuard**: Verifica rol de administrador

### Protección de Datos
- Tokens JWT de Supabase
- Validación de permisos en backend
- Sin exposición de datos sensibles en frontend

## 🎨 Componentes UI

### Librerías Utilizadas
- **PrimeNG**: Componentes de UI profesionales
- **Tailwind CSS**: Utilidades de estilo
- **Leaflet**: Mapas y geolocalización

### Componentes Compartidos
- **HeaderComponent**: Navegación principal
- **LoginComponent**: Formulario de login
- **LandingComponent**: Página principal
- **MapaComponent**: Visualización de ubicaciones

## 📱 Estados y Flujo de Solicitud

### Estados de Solicitud
1. **pendiente_aprobacion**: Esperando aprobación del proveedor
2. **esperando_anticipo**: Esperando pago de anticipo
3. **reservado**: Anticipo pagado, servicio reservado
4. **en_progreso**: Servicio en ejecución
5. **entregado_pendiente_liq**: Servicio entregado, esperando liquidación
6. **finalizado**: Proceso completado
7. **rechazada**: Solicitud rechazada por proveedor
8. **cancelada**: Cancelada por cliente
9. **abandonada**: Sistema marca como abandonada por inactividad

### Flujo de Pagos
- **Anticipo**: 30% del total para confirmar reserva
- **Liquidación**: 70% restante al finalizar el servicio
- **Métodos**: Transferencia, efectivo, depósito OXXO

## 🚀 Despliegue y Configuración

### Variables de Entorno
- Configuración de Supabase
- URLs de API
- Modo desarrollo/producción

### Comandos Principales
```bash
# Desarrollo
ng serve

# Build producción
ng build

# Testing
ng test
```

## 📝 Proceso Completo de Solicitud (Paso a Paso)

### Para el Cliente:
1. **Login** en la plataforma
2. **Crear Evento** con datos básicos
3. **Buscar Proveedores** en el marketplace
4. **Seleccionar Paquetes** y agregar al carrito
5. **Revisar Solicitud** con resumen completo
6. **Enviar Solicitud** al proveedor
7. **Esperar Aprobación** del proveedor
8. **Pagar Anticipo** (30%) para confirmar
9. **Dar Seguimiento** al progreso del evento
10. **Pagar Liquidación** (70%) al finalizar
11. **Calificar Servicio** y dejar reseña

### Para el Proveedor:
1. **Configurar Perfil** y paquetes de servicios
2. **Recibir Notificación** de nueva solicitud
3. **Revisar Solicitud** (detalles del evento)
4. **Aceptar o Rechazar** la solicitud
5. **Generar Cotización** (si es necesario)
6. **Confirmar Reserva** al recibir anticipo
7. **Preparar Servicio** según detalles
8. **Ejecutar Servicio** en la fecha acordada
9. **Notificar Completado** para liquidación
10. **Recibir Pago** restante
11. **Gestionar Calificación** del cliente

## 🔮 Características Futuras

- Sistema de notificaciones en tiempo real
- Chat integrado entre cliente y proveedor
- Pagos en línea con pasarelas de pago
- Sistema de recomendaciones IA
- App móvil nativa
- Integración con calendarios externos
- Sistema de fidelización y descuentos

---

Esta documentación describe el flujo completo y la arquitectura del sistema Festeasy, proporcionando una guía comprensiva para desarrolladores y stakeholders del proyecto.
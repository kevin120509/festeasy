# 📘 CONTEXTO COMPLETO DEL PROYECTO FESTEASY
## Documento para Implementación de Suscripciones de Proveedores

**Fecha:** 27 de Enero 2026  
**Versión Angular:** 21.1.0  
**Base de Datos:** Supabase (PostgreSQL)  
**Objetivo:** Proporcionar contexto completo para implementar sistema de suscripciones básicas

---

## 🎯 DESCRIPCIÓN DEL PROYECTO

**FestEasy** es un marketplace que conecta **clientes** que organizan eventos con **proveedores** de servicios (DJ, catering, fotografía, decoración, etc.).

### Problema que Resuelve
- Dificultad para encontrar proveedores confiables
- Falta de transparencia en cotizaciones
- Gestión centralizada de eventos

### Solución
Plataforma web con:
- Sistema de búsqueda de proveedores
- Solicitudes y cotizaciones en línea
- Panel de control para clientes y proveedores
- Sistema de autenticación por roles

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Framework:** Angular 21.1.0 (Standalone Components)
- **Lenguaje:** TypeScript 5.9.2
- **Base de Datos:** Supabase (PostgreSQL + Realtime)
- **Autenticación:** Supabase Auth
- **Estado:** Angular Signals
- **Estilos:** Tailwind CSS + PrimeNG
- **Mapas:** Leaflet
- **HTTP:** RxJS 7.8 + Supabase Client

### Características Técnicas Clave
- ✅ Standalone Components (sin NgModules)
- ✅ Nueva sintaxis de control flow (@if, @for)
- ✅ Signals para estado reactivo
- ✅ Guards funcionales (CanActivateFn)
- ✅ Supabase Realtime para notificaciones

---

## 📁 ESTRUCTURA DEL PROYECTO

```
src/app/
├── cliente/              # Módulo de Cliente
│   ├── registro/         # Registro de clientes
│   ├── dashboard/        # Dashboard principal
│   ├── marketplace/      # Búsqueda de proveedores
│   ├── proveedor-detalle/# Detalle de proveedor
│   ├── carrito/          # Carrito de servicios
│   ├── crear-evento/     # Formulario de evento
│   ├── solicitudes/      # Gestión de solicitudes
│   ├── seguimiento/      # Seguimiento de eventos
│   └── pago/             # Proceso de pago
│
├── proveedor/            # Módulo de Proveedor ⭐
│   ├── registro/         # Registro de proveedores
│   ├── dashboard/        # Dashboard principal
│   ├── solicitudes/      # Gestión de solicitudes recibidas
│   ├── bandeja-solicitudes/ # Bandeja de entrada
│   ├── paquetes/         # Gestión de paquetes/servicios
│   ├── notificaciones/   # Centro de notificaciones
│   ├── configuracion/    # Configuración de perfil
│   ├── validar-pin/      # Validación de servicio
│   └── layout/           # Layout compartido
│
├── admin/                # Módulo de Administrador
│   ├── dashboard/        # Dashboard admin
│   ├── users/            # Gestión de usuarios
│   └── provider-approval/# Aprobación de proveedores
│
├── shared/               # Componentes Compartidos
│   ├── header/           # Header principal
│   ├── landing/          # Página de inicio
│   └── login/            # Login
│
├── services/             # Servicios Globales ⭐
│   ├── supabase.service.ts          # Cliente Supabase
│   ├── supabase-auth.service.ts     # Autenticación
│   ├── supabase-data.service.ts     # Operaciones de datos
│   ├── auth.service.ts              # Estado de autenticación
│   ├── api.service.ts               # API legacy (HttpClient)
│   ├── solicitud-data.service.ts    # Gestión de solicitudes
│   ├── geo.service.ts               # Geolocalización
│   └── rating-modal.service.ts      # Sistema de calificaciones
│
├── guards/               # Protección de Rutas
│   ├── auth.guard.ts     # Verificación de autenticación
│   ├── role.guard.ts     # Verificación de roles
│   └── admin.guard.ts    # Verificación de admin
│
├── models/               # Interfaces TypeScript
│   └── index.ts          # Todas las interfaces
│
└── examples/             # Componentes de ejemplo
    ├── realtime-listener-example.component.ts
    └── rating-modal/
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS (SUPABASE)

### Tablas Principales

#### 1. **perfil_proveedor** ⭐ (Tabla clave para suscripciones)
```sql
CREATE TABLE perfil_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE REFERENCES auth.users(id),
  nombre_negocio VARCHAR NOT NULL,
  descripcion TEXT,
  telefono VARCHAR,
  avatar_url VARCHAR,
  direccion_formato VARCHAR,
  latitud NUMERIC,
  longitud NUMERIC,
  radio_cobertura_km INTEGER DEFAULT 20,
  tipo_suscripcion_actual TEXT NOT NULL DEFAULT 'basico' 
    CHECK (tipo_suscripcion_actual IN ('basico', 'plus')),  -- ⭐ CAMPO CLAVE
  categoria_principal_id UUID REFERENCES categorias_servicio(id),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  correo_electronico VARCHAR UNIQUE,
  estado TEXT DEFAULT 'active' CHECK (estado IN ('active', 'blocked')),
  datos_bancarios_json JSONB
);
```

#### 2. **historial_suscripciones** ⭐ (Nueva tabla para suscripciones)
```sql
CREATE TABLE historial_suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_usuario_id UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'plus')),
  monto_pagado NUMERIC NOT NULL,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  estado_pago TEXT NOT NULL DEFAULT 'pagado' 
    CHECK (estado_pago IN ('pagado', 'pendiente', 'fallido')),
  metodo_pago VARCHAR,
  referencia_transaccion VARCHAR,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **solicitudes** (Solicitudes de servicio)
```sql
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitud INTEGER GENERATED ALWAYS AS IDENTITY,
  cliente_usuario_id UUID NOT NULL REFERENCES auth.users(id),
  proveedor_usuario_id UUID NOT NULL REFERENCES auth.users(id),
  fecha_servicio DATE NOT NULL,
  direccion_servicio VARCHAR NOT NULL,
  titulo_evento VARCHAR,
  estado TEXT NOT NULL DEFAULT 'pendiente_aprobacion' 
    CHECK (estado IN (
      'pendiente_aprobacion', 'rechazada', 'esperando_anticipo', 
      'reservado', 'en_progreso', 'entregado_pendiente_liq', 
      'finalizado', 'cancelada', 'abandonada'
    )),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  monto_total NUMERIC DEFAULT 0,
  monto_anticipo NUMERIC DEFAULT 0,
  monto_liquidacion NUMERIC DEFAULT 0,
  pin_validacion TEXT,
  fecha_validacion_pin TIMESTAMP
);
```

#### 4. **paquetes_proveedor** (Servicios ofrecidos)
```sql
CREATE TABLE paquetes_proveedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_usuario_id UUID NOT NULL,
  categoria_servicio_id UUID NOT NULL REFERENCES categorias_servicio(id),
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' 
    CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  detalles_json JSONB
);
```

#### 5. **cotizaciones** (Cotizaciones de proveedores)
```sql
CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id),
  proveedor_usuario_id UUID NOT NULL,
  precio_total_propuesto NUMERIC NOT NULL,
  desglose_json JSONB,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' 
    CHECK (estado IN ('pendiente', 'aceptada_cliente', 'rechazada_cliente')),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. **resenas** (Sistema de calificaciones)
```sql
CREATE TABLE resenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id),
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  destinatario_id UUID NOT NULL REFERENCES auth.users(id),
  calificacion SMALLINT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. **bloqueos_calendario** (Disponibilidad manual)
```sql
CREATE TABLE bloqueos_calendario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_usuario_id UUID NOT NULL REFERENCES auth.users(id),
  fecha_bloqueada DATE NOT NULL,
  motivo VARCHAR DEFAULT 'Ocupado',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 MODELOS DE DATOS (TypeScript)

### Archivo: `src/app/models/index.ts`

```typescript
// Usuario base
export interface User {
  id: string;
  correo_electronico: string;
  rol: 'client' | 'provider' | 'admin';
  estado: 'active' | 'blocked';
  creado_en: string;
  actualizado_en: string;
}

// Perfil de Proveedor ⭐
export interface ProviderProfile {
  id: string;
  usuario_id?: string;
  nombre_negocio: string;
  descripcion?: string;
  telefono?: string;
  avatar_url?: string;
  direccion_formato?: string;
  latitud?: number;
  longitud?: number;
  radio_cobertura_km?: number;
  tipo_suscripcion_actual: 'basico' | 'plus';  // ⭐ CAMPO CLAVE
  categoria_principal_id?: string;
  creado_en: string;
  actualizado_en: string;
  correo_electronico?: string;
  estado?: 'active' | 'blocked';
  datos_bancarios_json?: any;
  precio_base?: number;
}

// Historial de Suscripciones ⭐
export interface SubscriptionHistory {
  id: string;
  proveedor_usuario_id: string;
  plan: 'basico' | 'plus';
  monto_pagado: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado_pago: 'pagado' | 'pendiente' | 'fallido';
  metodo_pago?: string;
  referencia_transaccion?: string;
  creado_en: string;
}

// Solicitud de Servicio
export interface ServiceRequest {
  id: string;
  numero_solicitud: number;
  cliente_usuario_id: string;
  proveedor_usuario_id: string;
  fecha_servicio: string;
  direccion_servicio: string;
  titulo_evento?: string;
  estado: 'pendiente_aprobacion' | 'rechazada' | 'esperando_anticipo' | 
          'reservado' | 'en_progreso' | 'entregado_pendiente_liq' | 
          'finalizado' | 'cancelada' | 'abandonada';
  creado_en: string;
  actualizado_en: string;
  monto_total?: number;
  pin_validacion?: string;
  fecha_validacion_pin?: string | Date;
  provider?: ProviderProfile;
  cliente?: ClientProfile;
}

// Paquete de Proveedor
export interface ProviderPackage {
  id: string;
  proveedor_usuario_id: string;
  categoria_servicio_id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  estado: 'borrador' | 'publicado' | 'archivado';
  creado_en: string;
  actualizado_en: string;
  detalles_json?: any;
}

// Cotización
export interface Quote {
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

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### AuthService (`src/app/services/auth.service.ts`)

**Responsabilidades:**
- Gestionar sesión de usuario con Supabase Auth
- Mantener estado reactivo con Signals
- Determinar rol del usuario (client/provider/admin)
- Cargar perfil del usuario

**Métodos Clave:**
```typescript
class AuthService {
  // Signals
  isLoggedIn = signal(false);
  currentUser = signal<any>(null);

  // Métodos principales
  async waitForAuth(): Promise<boolean>
  async refreshUserProfile(): Promise<void>
  async logout(): Promise<void>
  isClient(): boolean
  isProvider(): boolean
  getUserRole(): string | null
  async ensureClientProfile(): Promise<void>
}
```

**Flujo de Autenticación:**
1. Usuario hace login con Supabase Auth
2. AuthService determina rol desde DB (`perfil_cliente` o `perfil_proveedor`)
3. Carga perfil completo del usuario
4. Actualiza signals reactivos
5. Guards protegen rutas según rol

### SupabaseDataService (`src/app/services/supabase-data.service.ts`)

**Responsabilidades:**
- Operaciones CRUD con Supabase
- Gestión de proveedores, solicitudes, paquetes
- Manejo de disponibilidad y calendario

**Métodos Relevantes para Suscripciones:**
```typescript
class SupabaseDataService {
  public supabase: SupabaseClient;

  // Proveedores
  getProviders(): Observable<any[]>
  getProviderById(id: string): Observable<any>
  
  // Paquetes
  getProviderPackages(providerId: string): Observable<any[]>
  async createProviderPackage(packageData: any)
  
  // Solicitudes
  getRequestsByProvider(providerId: string): Observable<any[]>
  async createRequest(requestData: any)
  async updateRequestStatus(id: string, status: string)
}
```

---

## 🎨 FLUJOS PRINCIPALES DEL SISTEMA

### Flujo de Cliente (Solicitar Servicio)

```
1. Cliente → Crear Evento (/cliente/crear-evento)
   ↓
2. Cliente → Marketplace (/cliente/marketplace)
   - Buscar proveedores
   - Ver paquetes
   ↓
3. Cliente → Agregar al Carrito (/cliente/carrito)
   ↓
4. Cliente → Revisar Solicitud (/cliente/solicitudes/revisar)
   ↓
5. Sistema → Crear Solicitud en DB (estado: pendiente_aprobacion)
   ↓
6. Cliente → Ver Solicitud Enviada (/cliente/solicitud-enviada/:id)
```

### Flujo de Proveedor (Gestionar Solicitudes)

```
1. Proveedor → Recibe Notificación
   ↓
2. Proveedor → Bandeja de Solicitudes (/proveedor/solicitudes)
   - Ver solicitudes pendientes
   ↓
3. Proveedor → Aceptar Solicitud
   - Sistema pide precio de cotización (window.prompt)
   - Crea cotización en DB
   - Actualiza estado a 'reservado'
   ↓
4. Cliente → Recibe cotización
   - Puede aceptar o rechazar
   ↓
5. Cliente → Paga anticipo (30%)
   ↓
6. Proveedor → Ejecuta servicio
   ↓
7. Proveedor → Valida PIN del cliente
   ↓
8. Cliente → Paga liquidación (70%)
   ↓
9. Sistema → Marca como 'finalizado'
   ↓
10. Cliente → Califica servicio (modal automático con Realtime)
```

### Estados de Solicitud (Ciclo de Vida)

```
pendiente_aprobacion  → Esperando que proveedor acepte/rechace
       ↓
rechazada            → Proveedor rechazó (fin del flujo)
       ↓
esperando_anticipo   → Proveedor aceptó, esperando pago inicial
       ↓
reservado            → Anticipo pagado, servicio confirmado
       ↓
en_progreso          → Servicio en ejecución
       ↓
entregado_pendiente_liq → Servicio entregado, esperando pago final
       ↓
finalizado           → Proceso completado
```

---

## 🔔 SISTEMA DE NOTIFICACIONES EN TIEMPO REAL

### Implementación con Supabase Realtime

**Archivo:** `src/app/examples/realtime-listener-example.component.ts`

**Funcionalidad:**
- Escucha cambios en tabla `solicitudes` en tiempo real
- Cuando una solicitud cambia a estado 'finalizado'
- Abre modal de calificación automáticamente
- Solo para la solicitud que el cliente está viendo

**Código Ejemplo:**
```typescript
private setupRealtimeListener() {
  const channel = this.supabase
    .channel('solicitudes-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'solicitudes',
      filter: `cliente_usuario_id=eq.${this.currentUserId}`
    }, (payload: any) => {
      if (payload.new.estado === 'finalizado') {
        // Abrir modal de calificación
        this.openRatingModal(payload.new);
      }
    })
    .subscribe();
}
```

---

## 🎯 COMPONENTES CLAVE DEL PROVEEDOR

### 1. Dashboard de Proveedor
**Ruta:** `/proveedor/dashboard`  
**Archivo:** `src/app/proveedor/dashboard/dashboard.component.ts`

**Funcionalidades:**
- Métricas: Nuevas solicitudes, cotizaciones activas, ingresos
- Lista de solicitudes pendientes
- Pagos recientes
- Acceso rápido a todas las secciones

### 2. Bandeja de Solicitudes
**Ruta:** `/proveedor/solicitudes`  
**Archivo:** `src/app/proveedor/bandeja-solicitudes/bandeja-solicitudes.component.ts`

**Funcionalidades:**
- Grid de tarjetas con solicitudes recibidas
- Botones: Aceptar (con cotización) / Rechazar
- Filtros por estado
- Badges de estado con colores

### 3. Gestión de Paquetes
**Ruta:** `/proveedor/paquetes`  
**Archivo:** `src/app/proveedor/paquetes/paquetes.component.ts`

**Funcionalidades:**
- Crear/editar/eliminar paquetes de servicios
- Definir precios y descripciones
- Publicar/archivar paquetes
- Vista de onboarding si no hay paquetes

### 4. Configuración de Perfil
**Ruta:** `/proveedor/configuracion`  
**Archivo:** `src/app/proveedor/configuracion/configuracion.component.ts`

**Funcionalidades:**
- Editar información del negocio
- Cambiar foto de perfil
- Configurar radio de cobertura
- **⭐ AQUÍ SE PODRÍA AGREGAR GESTIÓN DE SUSCRIPCIÓN**

---

## 💡 INFORMACIÓN CLAVE PARA SUSCRIPCIONES

### Estado Actual del Sistema

**Campo Existente:**
- `perfil_proveedor.tipo_suscripcion_actual` → 'basico' | 'plus'
- Valor por defecto: 'basico'
- **Actualmente NO se usa en la lógica de negocio**

**Tabla Existente:**
- `historial_suscripciones` → Ya existe en el esquema
- **Actualmente NO se usa**

### Diferencias entre Planes (Sugeridas)

#### Plan Básico (Gratuito)
- Perfil visible en marketplace
- Recibir solicitudes
- Crear hasta 5 paquetes
- Responder cotizaciones

#### Plan Plus (De Pago)
- Todo lo del plan básico
- Paquetes ilimitados
- Destacado en búsquedas
- Estadísticas avanzadas
- Prioridad en notificaciones
- Badge "Plus" en perfil

### Ubicaciones Sugeridas para UI de Suscripciones

1. **Configuración de Proveedor** (`/proveedor/configuracion`)
   - Sección "Mi Suscripción"
   - Mostrar plan actual
   - Botón "Actualizar a Plus"

2. **Dashboard de Proveedor** (`/proveedor/dashboard`)
   - Banner promocional si es plan básico
   - Badge de plan actual en header

3. **Límites en Paquetes** (`/proveedor/paquetes`)
   - Bloquear creación si plan básico tiene 5+ paquetes
   - Mostrar mensaje "Actualiza a Plus para crear más paquetes"

---

## 🛠️ SERVICIOS Y MÉTODOS ÚTILES

### Para Implementar Suscripciones

**Métodos que necesitarás crear:**

```typescript
// En SupabaseDataService
async getProviderSubscription(providerId: string): Promise<ProviderProfile>
async updateProviderSubscription(providerId: string, plan: 'basico' | 'plus'): Promise<void>
async createSubscriptionHistory(data: SubscriptionHistory): Promise<void>
async getSubscriptionHistory(providerId: string): Promise<SubscriptionHistory[]>
async checkPackageLimit(providerId: string): Promise<boolean>
```

**Ejemplo de implementación:**

```typescript
async updateProviderSubscription(providerId: string, plan: 'basico' | 'plus') {
  const { data, error } = await this.supabase
    .from('perfil_proveedor')
    .update({ tipo_suscripcion_actual: plan })
    .eq('usuario_id', providerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async checkPackageLimit(providerId: string): Promise<boolean> {
  // Obtener perfil del proveedor
  const { data: profile } = await this.supabase
    .from('perfil_proveedor')
    .select('tipo_suscripcion_actual')
    .eq('usuario_id', providerId)
    .single();

  // Si es plan plus, no hay límite
  if (profile?.tipo_suscripcion_actual === 'plus') {
    return true;
  }

  // Si es plan básico, verificar que tenga menos de 5 paquetes
  const { count } = await this.supabase
    .from('paquetes_proveedor')
    .select('*', { count: 'exact', head: true })
    .eq('proveedor_usuario_id', providerId);

  return (count || 0) < 5;
}
```

---

## 📝 CONVENCIONES Y MEJORES PRÁCTICAS

### Naming Conventions
- **Componentes:** PascalCase (`SuscripcionComponent`)
- **Servicios:** camelCase con `.service.ts` (`subscription.service.ts`)
- **Variables:** camelCase (`currentPlan`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_PACKAGES_BASIC`)

### Signals (Estado Reactivo)
```typescript
// Crear signal
const currentPlan = signal<'basico' | 'plus'>('basico');

// Actualizar
currentPlan.set('plus');

// Leer
const plan = currentPlan();
```

### Supabase Queries
```typescript
// Siempre manejar errores
const { data, error } = await this.supabase
  .from('tabla')
  .select('*');

if (error) {
  console.error('Error:', error);
  throw error;
}

return data;
```

### Guards
```typescript
// Leer directamente de Supabase, no de signals
const { data: { session } } = await this.supabase.auth.getSession();
if (!session) {
  return false;
}
```

---

## 🚀 COMANDOS ÚTILES

```bash
# Iniciar servidor de desarrollo
ng serve

# Compilar para producción
ng build

# Generar nuevo componente
ng generate component proveedor/suscripcion

# Generar nuevo servicio
ng generate service services/subscription
```

---

## 📦 DEPENDENCIAS PRINCIPALES

```json
{
  "dependencies": {
    "@angular/core": "^21.1.0",
    "@angular/router": "^21.1.0",
    "@angular/forms": "^21.1.0",
    "@supabase/supabase-js": "^2.90.1",
    "primeng": "^21.0.4",
    "leaflet": "^1.9.4",
    "rxjs": "~7.8.0"
  }
}
```

---

## 🔗 CONFIGURACIÓN DE SUPABASE

**Archivo:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://ghlosgnopdmrowiygxdm.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  paypalClientId: 'Aep7v55aGp4_DdV4lKz2UGjX_mwGl9Mad09sU7CP_rV0...'
};
```

---

## 📋 CHECKLIST PARA IMPLEMENTAR SUSCRIPCIONES

### Backend (Supabase)
- [ ] Verificar que tabla `historial_suscripciones` existe
- [ ] Verificar que campo `tipo_suscripcion_actual` existe en `perfil_proveedor`
- [ ] Configurar políticas RLS para suscripciones
- [ ] Crear función para verificar límites de plan

### Frontend (Angular)
- [ ] Crear servicio `SubscriptionService`
- [ ] Crear componente `SuscripcionComponent` en `/proveedor/configuracion`
- [ ] Agregar lógica de límites en `PaquetesComponent`
- [ ] Mostrar badge de plan en `ProveedorLayoutComponent`
- [ ] Crear modal de upgrade a Plus
- [ ] Integrar pasarela de pago (PayPal ya configurado)
- [ ] Agregar ruta en `app.routes.ts`

### UI/UX
- [ ] Diseñar tarjetas de comparación de planes
- [ ] Crear banner promocional para plan básico
- [ ] Agregar badge "Plus" en perfiles
- [ ] Mensajes de límite alcanzado
- [ ] Confirmación de cambio de plan

---

## 🎯 RESUMEN EJECUTIVO

**FestEasy** es una plataforma Angular 21 + Supabase que conecta clientes con proveedores de eventos. El sistema actual tiene:

- ✅ Autenticación completa con roles
- ✅ Marketplace de proveedores
- ✅ Sistema de solicitudes y cotizaciones
- ✅ Gestión de paquetes para proveedores
- ✅ Sistema de pagos (anticipo + liquidación)
- ✅ Calificaciones en tiempo real
- ✅ Validación de servicios con PIN

**Para implementar suscripciones:**
- El esquema de DB ya tiene `tipo_suscripcion_actual` y `historial_suscripciones`
- Necesitas crear UI para gestionar planes
- Implementar lógica de límites (ej: 5 paquetes en plan básico)
- Integrar pasarela de pago (PayPal ya configurado)
- Agregar beneficios visuales (badges, destacados)

**Archivos clave a modificar:**
- `src/app/services/supabase-data.service.ts` → Métodos de suscripción
- `src/app/proveedor/configuracion/` → UI de gestión
- `src/app/proveedor/paquetes/` → Validación de límites
- `src/app/models/index.ts` → Ya tiene `SubscriptionHistory`

---

**Documento generado el:** 27 de Enero 2026  
**Para:** Implementación de Sistema de Suscripciones Básicas  
**Proyecto:** FestEasy v1.0

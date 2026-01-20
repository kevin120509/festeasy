# 📅 Documentación de la Lógica del Calendario - FestEasy Agenda

## 🎯 Objetivo

El componente de Agenda permite a los proveedores visualizar su calendario de disponibilidad, gestionar fechas bloqueadas y ver detalles de eventos confirmados.

---

## 🏗️ Arquitectura del Componente

### **Signals (Estado Reactivo)**

El componente utiliza **Angular Signals** para manejar el estado de forma reactiva:

| Signal | Tipo | Descripción |
|--------|------|-------------|
| `currentDate` | `Date` | Mes/año actualmente visualizado en el calendario |
| `selectedDate` | `Date \| null` | Fecha seleccionada por el usuario |
| `calendarDays` | `CalendarDay[]` | Array de días generados para el grid del calendario |
| `occupiedDates` | `any[]` | Fechas con eventos confirmados (de tabla `solicitudes`) |
| `blockedDates` | `any[]` | Fechas bloqueadas manualmente (de tabla `disponibilidad_bloqueada`) |
| `eventsForSelectedDate` | `CalendarEvent[]` | Eventos de la fecha seleccionada |
| `isLoading` | `boolean` | Indicador de carga de datos |
| `providerId` | `string` | ID del proveedor autenticado |

### **Computed Values**

```typescript
monthYear() → "octubre 2023"  // Nombre del mes/año actual
formattedSelectedDate() → "16 oct 2023"  // Fecha seleccionada formateada
```

---

## 🔄 Flujo de Carga de Datos

### **1. Inicialización (ngOnInit)**

```
Usuario accede → loadProviderData() → loadCalendarData() → generateCalendar()
```

#### **loadProviderData()**
- Obtiene el usuario autenticado desde `SupabaseAuthService`
- Extrae el `user.id` y lo guarda en `providerId` signal
- Si no hay usuario, redirige a `/login`

#### **loadCalendarData()**
- Utiliza **forkJoin** para cargar datos en paralelo:
  - `getOccupiedDates(providerId)`: Eventos confirmados ("Reservado" o "Pagado")
  - `getBlockedDates(providerId)`: Fechas bloqueadas manualmente
- Guarda resultados en signals `occupiedDates` y `blockedDates`
- Llama a `generateCalendar()` para renderizar el mes

---

## 📊 Generación del Calendario

### **generateCalendar()**

Genera un grid de 35-42 días que incluye:

1. **Días del mes anterior** (para completar la primera semana)
2. **Días del mes actual**
3. **Días del mes siguiente** (para completar la última semana)

**Ejemplo visual:**
```
LUN  MAR  MIÉ  JUE  VIE  SÁB  DOM
30   1    2    3    4    5    6   ← 30 es del mes anterior
7    8    9    10   11   12   13
14   15   [16] 17   18   19   20  ← [16] seleccionado
21   22   23   24   25   26   27
28   29   30   31   1    2    3   ← 1,2,3 son del mes siguiente
```

### **createCalendarDay(date, isCurrentMonth): CalendarDay**

Crea cada objeto `CalendarDay` con:

```typescript
{
  date: Date,               // Fecha completa
  dayNumber: number,        // Número del día (1-31)
  isCurrentMonth: boolean,  // ¿Es del mes actual?
  isToday: boolean,         // ¿Es hoy?
  isSelected: boolean,      // ¿Está seleccionado?
  state: 'available' | 'occupied' | 'blocked',  // Estado visual
  blockId?: string          // ID del bloqueo (si aplica)
}
```

#### **Lógica de Estados** (Prioridad: occupied > blocked > available)

```typescript
// 1. ¿Tiene eventos confirmados? → 'occupied' (círculo rojo)
const isOccupied = occupiedDates.some(event => 
  event.fecha_servicio.startsWith(dateString)
);

// 2. ¿Está bloqueado manualmente? → 'blocked' (fondo rosa)
const blockedDate = blockedDates.find(block => 
  block.fecha === dateString
);

// 3. De lo contrario → 'available' (disponible)
let state = 'available';
if (isOccupied) state = 'occupied';
else if (isBlocked) state = 'blocked';
```

---

## 🖱️ Interacción del Usuario

### **Seleccionar un Día (selectDate)**

```typescript
selectDate(day: CalendarDay) {
  1. Actualiza selectedDate signal
  2. Regenera el calendario (para actualizar CSS de selección)
  3. Carga eventos de esa fecha → loadEventsForDate()
}
```

### **loadEventsForDate(date)**

Consulta Supabase para obtener eventos de la fecha seleccionada:

```sql
SELECT *, perfil_cliente(nombre_completo, telefono)
FROM solicitudes
WHERE proveedor_usuario_id = '...'
  AND fecha_servicio >= '2023-10-16'
  AND fecha_servicio < '2023-10-16T23:59:59'
  AND estado IN ('reservado', 'Reservado', 'pagado', 'Pagado', 'en_progreso')
```

Resultado → Se muestra en el panel "Detalles del Día"

---

## 🎨 Renderizado Visual

### **Estados de los Días**

| Estado | Clases CSS | Apariencia |
|--------|-----------|-----------|
| `available` | `.day-cell.available` | Número negro, fondo blanco |
| `occupied` | `.day-cell.occupied` | Círculo rojo sólido (#ff4444) |
| `blocked` | `.day-cell.blocked` | Fondo rosa claro (#ffe0e0) |
| `selected` | `.day-cell.selected` | Fondo rosa claro (#ffe0e0) |
| `other-month` | `.day-cell.other-month` | Texto gris claro (#ccc) |

### **Código del Template**

```html
<div (click)="selectDate(day)" 
     class="day-cell"
     [class.other-month]="!day.isCurrentMonth"
     [class.available]="day.state === 'available' && day.isCurrentMonth"
     [class.occupied]="day.state === 'occupied'"
     [class.blocked]="day.state === 'blocked'"
     [class.selected]="day.isSelected">
  {{ day.dayNumber }}
</div>
```

---

## 🔧 Funciones de Gestión

### **Bloquear Fecha Manualmente**

```typescript
async blockDateManually() {
  1. Obtiene la fecha seleccionada
  2. Inserta en tabla 'disponibilidad_bloqueada':
     {
       provider_id: providerId,
       fecha: '2023-10-16',
       motivo: 'Bloqueo manual'
     }
  3. Recarga el calendario → loadCalendarData()
}
```

### **Desbloquear Fecha**

```typescript
async unblockDate(blockId: string) {
  1. Elimina el registro de 'disponibilidad_bloqueada' por ID
  2. Recarga el calendario
}
```

---

## 📈 Optimizaciones Aplicadas

### ✅ **Performance**
- **forkJoin** para cargar datos en paralelo (no secuencial)
- **Signals** para actualizaciones reactivas solo cuando cambian los datos
- **Computed values** para evitar recálculos innecesarios

### ✅ **UX**
- Mensajes de consola informativos con emojis (✅, 📅)
- Manejo de errores con navegación a login si no hay usuario
- Estados visuales claros (círculos rojos, fondos rosas)

### ✅ **Código Limpio**
- JSDoc completo en funciones clave
- Eliminación de código no usado (`NgClass`, `getDayClasses`)
- Validaciones de `providerId` antes de cada operación

---

## 🔗 Integración con Supabase

### **Tablas Utilizadas**

1. **`solicitudes`** → Eventos confirmados
   - Columnas: `proveedor_usuario_id`, `fecha_servicio`, `titulo_evento`, `direccion_servicio`, `estado`
   - Estados considerados: `'reservado'`, `'Reservado'`, `'pagado'`, `'Pagado'`

2. **`disponibilidad_bloqueada`** → Bloqueos manuales
   - Columnas: `provider_id`, `fecha`, `motivo`

3. **`perfil_cliente`** → Información del cliente (JOIN)
   - Columnas: `nombre_completo`, `telefono`

---

## 🚀 Resultado Final

El usuario proveedor puede:

✅ Ver su calendario mensual con días ocupados (círculos rojos)  
✅ Identificar días bloqueados manualmente (fondo rosa)  
✅ Seleccionar un día para ver detalles de eventos  
✅ Bloquear/desbloquear fechas manualmente  
✅ Navegar entre meses con flechas  

---

## 📝 Ejemplo de Uso

```typescript
// Al hacer clic en el día 16 de octubre:
1. selectDate() actualiza selectedDate
2. generateCalendar() regenera el grid con [16] marcado como selected
3. loadEventsForDate() consulta eventos del 16/10/2023
4. eventsForSelectedDate signal se actualiza
5. El template muestra los eventos en "Detalles del Día"
```

---

**⚡ Desarrollado por:** Equipo FestEasy  
**📅 Última actualización:** 2026-01-20

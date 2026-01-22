# 📅 Troubleshooting: Calendario de Agenda del Proveedor

## 🎯 Funcionalidad Actual Implementada

El componente `AgendaComponent` **YA TIENE** toda la funcionalidad necesaria implementada:

### ✅ Funciones Existentes:

1. **`loadProviderEvents()`** - Carga eventos del proveedor
2. **`generateCalendar()`** - Genera el calendario con días marcados
3. **`selectDate(day)`** - Maneja el click en un día
4. **`loadEventsForDate(date)`** - Carga eventos para un día específico
5. **`createCalendarDay(date, isCurrentMonth)`** - Crea cada día del calendario
   - Verifica si está ocupado (`isOccupied`)
   - Marca with estado: `'available' | 'occupied' | 'blocked'`

---

## 🔍 Verificación: ¿Por qué no se ven los días marcados?

### Paso 1: Verifica los Estados en Supabase

Los métodos buscan estos estados en la tabla `solicitudes`:

- ✅ `'reservado'` (minúsculas)
- ✅ `'Reservado'` (mayúscula inicial)
- ✅ `'pagado'` (minúsculas)
- ✅ `'Pagado'` (mayúscula inicial)
- ✅ `'en_progreso'` (solo para eventos de un día específico)

**� Acción**: Abre Supabase y verifica:

```sql
SELECT id, estado, fecha_servicio, titulo_evento 
FROM solicitudes 
WHERE proveedor_usuario_id = 'TU_PROVEEDOR_ID'
  AND estado IN ('reservado', 'Reservado', 'pagado', 'Pagado');
```

### Paso 2: Verifica la Consola del Navegador

El código ya tiene logs implementados:

```typescript
console.log(`✅ Loaded ${typedEvents.length} occupied dates (Pagado/Confirmado)`);
console.log(`✅ Loaded ${blocked.length} manually blocked dates`);
```

**🔍 Acción**: 
1. Abre F12 → Console
2. Navega a la vista de agenda
3. Busca estos mensajes
4. Verifica si `typedEvents.length` es > 0

### Paso 3: Verifica el Formato de Fecha

El código compara fechas así:

```typescript
const isOccupied = this.occupiedDates().some(event =>
    event.fecha_servicio.startsWith(dateString)
);
```

Donde `dateString` es formato: `'2026-01-22'`

**🔍 Acción**: Asegúrate de que en Supabase:
- `fecha_servicio` esté en formato ISO: `'2026-01-22T10:00:00'`
- O al menos comience con: `'2026-01-22'`

---

## 🎨 Visual: Cómo se Marcan los Días

### Estado 'occupied' (Ocupado con evento confirmado):

**CSS en `agenda.html`**:
```html
@if (day.state === 'occupied') {
  <!-- Punto rojo debajo del número -->
  <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2">
    <div class="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
  </div>
}
```

**Clases Tailwind**:
```css
w-1.5 h-1.5       /* Tamaño 6px x 6px */
bg-red-500        /* Rojo */
rounded-full      /* Círculo perfecto */
```

---

## 🧪 Prueba Manual

### Test 1: Insertar Solicitud de Prueba

```sql
INSERT INTO solicitudes (
  proveedor_usuario_id,
  cliente_usuario_id,
  fecha_servicio,
  titulo_evento,
  direccion_servicio,
  estado,
  creado_en,
  actualizado_en
) VALUES (
  'TU_PROVEEDOR_ID',           -- Cambia esto
  'CUALQUIER_CLIENTE_ID',       -- Cambia esto
  '2026-01-25T14:00:00',        -- Fecha futura
  'Evento de Prueba',
  'Calle Falsa 123',
  'reservado',                   -- Estado en minúsculas
  NOW(),
  NOW()
);
```

**Resultado Esperado**: 
- Día 25 debe tener un punto rojo debajo del número

### Test 2: Verificar Provider ID

En la consola del navegador:

```javascript
// Debería mostrar el ID del proveedor
this.providerId()
```

Si es `''` (vacío), el problema es la autenticación.

---

## 🔧 Soluciones Rápidas

### Problema: No se ven puntos rojos

**Solución 1**: Verifica el estado en Supabase

```sql
UPDATE solicitudes 
SET estado = 'reservado'  -- Todo en minúsculas
WHERE id = 'TU_SOLICITUD_ID';
```

**Solución 2**: Verifica el Provider ID

En `agenda.component.ts`, la función `loadProviderData()` debe setear el ID:

```typescript
async loadProviderData(): Promise<void> {
    const user = await this.auth.getCurrentUser();
    if (user?.id) {
        this.providerId.set(user.id);  // ← Esto debe ejecutarse
        console.log(`✅ Provider authenticated: ${user.id}`);  // ← Debe aparecer en consola
    }
}
```

**Solución 3**: Refresca la carga de eventos

```typescript
// En ngOnInit:
async ngOnInit(): Promise<void> {
    await this.loadProviderData();
    this.loadProviderEvents();  // ← Esto debe ejecutarse DESPUÉS de loadProviderData
}
```

---

## 📊 Panel "Detalles del Día"

Cuando haces click en un día:

### Flujo:

1. **Click en día** → `selectDate(day)` se ejecuta
2. `selectedDate.set(day.date)` → Actualiza el día seleccionado
3. `generateCalendar()` → Regenera calendary para mostrar selección
4. `loadEventsForDate(day.date)` → Carga eventos del día
5. `selectedEvents.set(typedEvents)` → Actualiza panel de detalles

### HTML del Panel:

```html
@for (event of selectedEvents(); track event.id) {
  <div class="p-4 bg-gray-50...">
    <h4>{{ event.titulo_evento }}</h4>
    <p>{{ formatEventTime(event.fecha_servicio) }}</p>
    <p>{{ event.perfil_cliente?.nombre_completo || 'Cliente' }}</p>
    <p>{{ event.direccion_servicio }}</p>
  </div>
}
```

---

## 🎯 Checklist Completo

### Base de Datos (Supabase):

- [ ] Tabla `solicitudes` existe
- [ ] Hay al menos 1 solicitud con:
  - `estado = 'reservado'` o `'pagado'`
  - `fecha_servicio` en formato ISO
  - `proveedor_usuario_id` coincide con el usuario actual
- [ ] Campo `perfil_cliente` tiene datos (para mostrar nombre)

### Autenticación:

- [ ] Usuario está autenticado como proveedor
- [ ] `this.providerId()` no está vacío
- [ ] Console muestra: `✅ Provider authenticated: [ID]`

### Datos Cargados:

- [ ] Console muestra: `✅ Loaded X occupied dates`
- [ ] `X` es mayor que 0
- [ ] `this.occupiedDates()` tiene datos

### Visual:

- [ ] Calendario se genera correctamente
- [ ] Los días del mes actual están visibles
- [ ] Al menos un día tiene `state === 'occupied'`
- [ ] Ese día muestra un punto rojo debajo del número

### Interacción:

- [ ] Click en un día lo selecciona (fondo gris)
- [ ] Panel "Detalles del Día" se actualiza
- [ ] Eventos del día se muestran con título, hora, cliente

---

## 🚀 Script de Debug Completo

Copia y pega esto en la consola del navegador cuando estés en la vista de agenda:

```javascript
// 1. Verificar Provider ID
console.log('Provider ID:', this.providerId());

// 2. Verificar eventos cargados
console.log('Occupied Dates:', this.occupiedDates());

// 3. Verificar días del calendario
console.log('Calendar Days:', this.calendarDays());

// 4. Buscar días ocupados
const occupiedDays = this.calendarDays().filter(d => d.state === 'occupied');
console.log('Días con eventos:', occupiedDays.length);
console.log('Detalles:', occupiedDays);

// 5. Verificar eventos seleccionados
console.log('Eventos del día seleccionado:', this.selectedEvents());
```

---

## 📝 Notas Importantes

1. **El código YA ESTÁ IMPLEMENTADO** - No necesitas agregar nuevas funciones
2. **El problema probablemente es de datos** - Verifica Supabase
3. **Los estados deben coincidir** - 'reservado', 'Reservado', 'pagado', 'Pagado'
4. **El Provider ID debe estar correcto** - Usa el debug script

---

**Última actualización**: 2026-01-22  
**Estado**: Componente completamente funcional, verificar datos en Supabase

# RatingModalComponent - Documentación

## Descripción
Componente modal para calificar servicios finalizados en FestEasy. Permite a los clientes dejar reseñas con calificación de 1-5 estrellas y comentarios opcionales.

## Características

✅ **Selector de 5 Estrellas Interactivo** - Hover effects y animaciones suaves  
✅ **Textarea para Comentarios** - Máximo 500 caracteres, opcional  
✅ **Validación de Campos** - Requiere calificación mínima  
✅ **Integración con Supabase** - INSERT directo en tabla `resenas`  
✅ **Diseño Premium** - Tailwind CSS con gradientes y animaciones  
✅ **Feedback Visual** - Mensajes de éxito/error  
✅ **Cierre Automático** - Se cierra 2 segundos después del envío exitoso  

## Archivos Creados

1. **`src/app/components/rating-modal.component.ts`** - Componente principal del modal
2. **`src/app/services/rating-modal.service.ts`** - Servicio para abrir/cerrar el modal programáticamente
3. **`src/app/examples/rating-modal-example.component.ts`** - Componente de demostración
4. **`src/app/services/api.service.ts`** - Método `createReview()` agregado

## Uso Básico

### Opción 1: Usando el Servicio (Recomendado)

```typescript
import { Component, inject } from '@angular/core';
import { RatingModalService } from './services/rating-modal.service';

@Component({
  selector: 'app-mi-componente',
  template: `
    <button (click)="abrirCalificacion()">
      Calificar Servicio
    </button>
  `
})
export class MiComponente {
  private ratingModal = inject(RatingModalService);

  async abrirCalificacion() {
    const solicitudId = 'uuid-de-la-solicitud';
    const proveedorId = 'uuid-del-proveedor';
    
    await this.ratingModal.open(solicitudId, proveedorId);
    console.log('Modal cerrado');
  }
}
```

### Opción 2: Integración con Listener en Tiempo Real

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from './services/api.service';
import { RatingModalService } from './services/rating-modal.service';

@Component({
  selector: 'app-cliente-dashboard'
})
export class ClienteDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private ratingModal = inject(RatingModalService);

  ngOnInit(): void {
    // Escuchar cuando un servicio se finaliza
    this.apiService.listenToSolicitudFinalizada().subscribe({
      next: ({ solicitud_id, destinatario_id }) => {
        console.log('🎉 Servicio finalizado, abriendo modal de calificación');
        
        // Abrir modal automáticamente
        this.ratingModal.open(solicitud_id, destinatario_id);
      }
    });
  }
}
```

### Opción 3: Desde el Historial de Servicios

```typescript
@Component({
  template: `
    <div class="service-card">
      <h3>{{ servicio.titulo }}</h3>
      <p>Estado: {{ servicio.estado }}</p>
      
      @if (servicio.estado === 'finalizado' && !servicio.tiene_resena) {
        <button (click)="calificarServicio(servicio)">
          ⭐ Dejar Reseña
        </button>
      }
    </div>
  `
})
export class HistorialServiciosComponent {
  private ratingModal = inject(RatingModalService);

  calificarServicio(servicio: any) {
    this.ratingModal.open(
      servicio.id,
      servicio.proveedor_usuario_id
    );
  }
}
```

## Estructura de Datos

### Input (Requerido)
```typescript
{
  solicitudId: string;    // UUID de la solicitud
  destinatarioId: string; // UUID del proveedor
}
```

### Output (Enviado a Supabase)
```typescript
{
  solicitud_id: string;   // UUID de la solicitud
  autor_id: string;       // UUID del cliente (auto-obtenido)
  destinatario_id: string; // UUID del proveedor
  calificacion: number;   // 1-5
  comentario?: string;    // Opcional, máx 500 caracteres
}
```

## Métodos del Servicio

### `RatingModalService.open(solicitudId, destinatarioId)`
Abre el modal de calificación.

**Parámetros:**
- `solicitudId: string` - ID de la solicitud a calificar
- `destinatarioId: string` - ID del proveedor

**Retorna:** `Promise<void>` - Se resuelve cuando el modal se cierra

**Ejemplo:**
```typescript
await this.ratingModalService.open(
  '123e4567-e89b-12d3-a456-426614174000',
  '987e6543-e21b-98d7-a654-123456789000'
);
```

### `RatingModalService.close()`
Cierra el modal actual (si está abierto).

**Ejemplo:**
```typescript
this.ratingModalService.close();
```

## Métodos de ApiService

### `createReview(reviewData)`
Crea una nueva reseña en la tabla `resenas`.

**Parámetros:**
```typescript
{
  solicitud_id: string;
  autor_id: string;
  destinatario_id: string;
  calificacion: number;
  comentario?: string;
}
```

**Retorna:** `Observable<any>`

**Ejemplo:**
```typescript
this.apiService.createReview({
  solicitud_id: 'uuid-solicitud',
  autor_id: 'uuid-cliente',
  destinatario_id: 'uuid-proveedor',
  calificacion: 5,
  comentario: 'Excelente servicio'
}).subscribe({
  next: (response) => console.log('Reseña creada:', response),
  error: (err) => console.error('Error:', err)
});
```

## Configuración de Supabase

### Tabla `resenas`
Asegúrate de que la tabla existe con la siguiente estructura:

```sql
CREATE TABLE resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id UUID REFERENCES solicitudes(id),
  autor_id UUID REFERENCES auth.users(id),
  destinatario_id UUID REFERENCES auth.users(id),
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);
```

### Políticas RLS
```sql
-- Permitir a los clientes crear reseñas
CREATE POLICY "Clientes pueden crear reseñas"
ON resenas FOR INSERT
WITH CHECK (auth.uid() = autor_id);

-- Permitir a todos leer reseñas
CREATE POLICY "Todos pueden leer reseñas"
ON resenas FOR SELECT
USING (true);
```

## Personalización

### Cambiar Colores
Edita las clases de Tailwind en el template:

```typescript
// Cambiar de amarillo/naranja a azul/púrpura
class="bg-gradient-to-br from-blue-400 to-purple-500"
class="bg-gradient-to-r from-blue-400 to-purple-500"
```

### Cambiar Textos de Calificación
Edita el método `getRatingText()`:

```typescript
getRatingText(): string {
  const texts: Record<number, string> = {
    1: 'Muy Insatisfecho',
    2: 'Insatisfecho',
    3: 'Neutral',
    4: 'Satisfecho',
    5: 'Muy Satisfecho'
  };
  return texts[this.rating()] || '';
}
```

### Cambiar Tiempo de Cierre Automático
Edita el timeout en `onSubmit()`:

```typescript
setTimeout(() => {
  this.onCancel();
}, 3000); // 3 segundos en lugar de 2
```

## Testing

### Probar el Componente
1. Navega a `/examples/rating-modal-demo` (si agregaste la ruta)
2. Ingresa un UUID de solicitud válido
3. Ingresa un UUID de proveedor válido
4. Haz clic en "Abrir Modal de Calificación"
5. Selecciona estrellas y escribe un comentario
6. Haz clic en "Enviar Reseña"
7. Verifica en Supabase que la reseña se creó correctamente

### Agregar Ruta de Ejemplo
En `app.routes.ts`:

```typescript
{
  path: 'examples/rating-modal-demo',
  component: RatingModalExampleComponent
}
```

## Troubleshooting

### El modal no se abre
- Verifica que `RatingModalService` esté inyectado correctamente
- Revisa la consola del navegador para errores
- Asegúrate de pasar UUIDs válidos

### Error al enviar reseña
- Verifica que el usuario esté autenticado
- Revisa las políticas RLS en Supabase
- Verifica que la tabla `resenas` existe
- Revisa la consola para mensajes de error detallados

### Las estrellas no se muestran
- Asegúrate de tener Material Symbols cargado en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
```

## Próximos Pasos

1. **Integrar en Dashboard del Cliente** - Agregar botón "Dejar Reseña" en servicios finalizados
2. **Mostrar Reseñas en Perfil de Proveedor** - Crear componente para mostrar reseñas recibidas
3. **Calcular Promedio de Calificaciones** - Actualizar perfil de proveedor con rating promedio
4. **Notificaciones** - Notificar al proveedor cuando recibe una nueva reseña
5. **Prevenir Duplicados** - Verificar que el cliente no haya dejado reseña previamente

## Ejemplo Completo

Ver `src/app/examples/rating-modal-example.component.ts` para un ejemplo completo funcional.

---

**Creado para:** FestEasy  
**Versión:** 1.0.0  
**Última actualización:** 2026-01-26

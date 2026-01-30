# Listener en Tiempo Real - Solicitudes Finalizadas

## Descripción
Este listener detecta en tiempo real cuando una solicitud cambia su estado a 'finalizado' para el usuario cliente actual.

## Implementación

### 1. En el Servicio (ApiService)

El listener ya está implementado en `api.service.ts` con las siguientes características:

- ✅ Usa `supabase.channel()` para escuchar cambios de tipo UPDATE
- ✅ Filtra eventos donde `new.estado === 'finalizado'`
- ✅ Verifica que `cliente_usuario_id` coincida con el usuario actual
- ✅ Devuelve `solicitud_id` y `destinatario_id` (ID del proveedor)
- ✅ Implementa limpieza automática en `ngOnDestroy`

### 2. Uso en Componentes

#### Ejemplo básico:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from './services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html'
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {
  private solicitudFinalizadaSubscription?: Subscription;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Iniciar el listener
    this.solicitudFinalizadaSubscription = this.apiService
      .listenToSolicitudFinalizada()
      .subscribe({
        next: ({ solicitud_id, destinatario_id }) => {
          console.log('🎉 Solicitud finalizada:', solicitud_id);
          console.log('👤 Proveedor:', destinatario_id);
          
          // Aquí puedes:
          // 1. Mostrar una notificación al usuario
          // 2. Actualizar la lista de solicitudes
          // 3. Redirigir a una página de reseña
          // 4. Enviar una notificación push
          
          this.mostrarNotificacion(solicitud_id, destinatario_id);
        },
        error: (err) => {
          console.error('❌ Error en listener:', err);
        }
      });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.solicitudFinalizadaSubscription) {
      this.solicitudFinalizadaSubscription.unsubscribe();
    }
    
    // Detener el listener (opcional, ya se hace en ApiService.ngOnDestroy)
    this.apiService.stopListeningToSolicitudes();
  }

  private mostrarNotificacion(solicitudId: string, proveedorId: string): void {
    // Implementar lógica de notificación
    alert(`¡Tu servicio ha finalizado! Solicitud: ${solicitudId}`);
  }
}
```

#### Ejemplo con Angular Signals:

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html'
})
export class ClienteDashboardComponent implements OnInit {
  solicitudFinalizada = signal<{ solicitud_id: string; destinatario_id: string } | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.listenToSolicitudFinalizada().subscribe({
      next: (data) => {
        this.solicitudFinalizada.set(data);
        // Mostrar modal de reseña o notificación
      }
    });
  }
}
```

### 3. Casos de Uso

#### A. Mostrar notificación y redirigir a reseñas

```typescript
private mostrarNotificacion(solicitudId: string, proveedorId: string): void {
  // Mostrar toast o modal
  this.toastService.success('¡Tu servicio ha finalizado!');
  
  // Redirigir a página de reseñas después de 2 segundos
  setTimeout(() => {
    this.router.navigate(['/cliente/resenas/crear'], {
      queryParams: { 
        solicitud_id: solicitudId,
        proveedor_id: proveedorId 
      }
    });
  }, 2000);
}
```

#### B. Actualizar lista de solicitudes automáticamente

```typescript
ngOnInit(): void {
  this.cargarSolicitudes();
  
  this.apiService.listenToSolicitudFinalizada().subscribe({
    next: () => {
      // Recargar la lista cuando se finaliza una solicitud
      this.cargarSolicitudes();
    }
  });
}

private cargarSolicitudes(): void {
  this.apiService.getClientRequestsReal().subscribe({
    next: (solicitudes) => {
      this.solicitudes.set(solicitudes);
    }
  });
}
```

#### C. Enviar notificación push (si tienes servicio de notificaciones)

```typescript
private enviarNotificacionPush(solicitudId: string): void {
  this.notificationService.send({
    title: '¡Servicio Finalizado!',
    body: 'Tu proveedor ha marcado el servicio como finalizado',
    icon: 'assets/icons/check-circle.png',
    data: { solicitud_id: solicitudId }
  });
}
```

## Configuración de Supabase

Para que el listener funcione correctamente, asegúrate de que:

1. **Realtime está habilitado** en tu tabla `solicitudes` en Supabase
2. **RLS (Row Level Security)** permite al cliente leer sus propias solicitudes:

```sql
-- Política de lectura para clientes
CREATE POLICY "Clientes pueden ver sus solicitudes"
ON solicitudes FOR SELECT
USING (auth.uid() = cliente_usuario_id);

-- Habilitar Realtime en la tabla
ALTER TABLE solicitudes REPLICA IDENTITY FULL;
```

## Notas Importantes

- ⚠️ El listener se inicia cuando llamas a `listenToSolicitudFinalizada()`
- ⚠️ Solo emite eventos cuando el estado cambia de cualquier valor a `'finalizado'`
- ⚠️ Automáticamente filtra por el `cliente_usuario_id` del usuario actual
- ⚠️ La limpieza del canal se hace automáticamente en `ngOnDestroy` del servicio
- ⚠️ Puedes llamar a `stopListeningToSolicitudes()` manualmente si necesitas detener el listener antes

## Testing

Para probar el listener:

1. Inicia sesión como cliente
2. Crea una solicitud
3. Desde Supabase Dashboard o como proveedor, actualiza el estado a 'finalizado'
4. Deberías ver los logs en consola y la notificación correspondiente

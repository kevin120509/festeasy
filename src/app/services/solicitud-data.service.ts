import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SolicitudDataService {
  private supabaseService = inject(SupabaseService);

  // Guarda la solicitud y los items en la base de datos
  guardarSolicitudCompleta(solicitud: any, proveedor: any, paquetes: any[]): Observable<any> {
    // 1. Insertar en solicitudes
    const supabase = this.supabaseService.getClient();
    return from(
      supabase.from('solicitudes').insert({
        cliente_usuario_id: solicitud.cliente_usuario_id,
        proveedor_usuario_id: proveedor.usuario_id,
        fecha_servicio: solicitud.fecha_servicio,
        direccion_servicio: solicitud.ubicacion,
        titulo_evento: solicitud.titulo_evento || 'Evento',
        estado: 'pendiente_aprobacion',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }).select().single()
    ).pipe(
      // 2. Insertar en items_solicitud usando el id de la solicitud creada
      // (esto se haría en el subscribe del componente de revisión)
      // Aquí, para simplificar, solo devolvemos la solicitud creada
      // Pero ahora insertamos los items_solicitud
      // Usamos switchMap para encadenar la inserción
      switchMap((solicitudCreada: any) => {
        if (!solicitudCreada || !solicitudCreada.id) return [solicitudCreada];
        const items = paquetes.map((p: any) => ({
          solicitud_id: solicitudCreada.id,
          paquete_id: p.id,
          nombre_paquete_snapshot: p.nombre,
          cantidad: p.cantidad || 1,
          precio_unitario: p.precio_base
        }));
        if (items.length === 0) return [solicitudCreada];
        return from(supabase.from('items_solicitud').insert(items)).pipe(
          map(() => solicitudCreada)
        );
      })
    );
  }
}

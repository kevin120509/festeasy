import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

/**
 * Servicio encargado de la lógica de negocio para la gestión de fechas, 
 * disponibilidad y reglas de SLA de la aplicación.
 */
@Injectable({
    providedIn: 'root'
})
export class CalendarioFechaService {
    private supabaseService = inject(SupabaseService);

    private formatDateISO(date: Date): string {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * 1. Agenda y Bloqueo de Fechas
     * Conecta a la base de datos para validar disponibilidad y prevenir agendamientos duplicados o bloqueados.
     */
    consultarDisponibilidad(providerId: string, fecha: Date): Observable<{ disponible: boolean, error?: string }> {
        const supabase = this.supabaseService.getClient();
        const fechaISO = this.formatDateISO(fecha);

        // 1.1 Validación de Fechas Pasadas (Regla 2)
        if (!this.validarFechaFutura(fecha)) {
            return of({ disponible: false, error: 'No puedes agendar citas en fechas que ya han pasado.' });
        }

        // 1.2 Validar si la fecha está bloqueada por el proveedor (Regla 1)
        return from(
            supabase.from('disponibilidad_bloqueada')
                .select('*')
                .eq('provider_id', providerId)
                .eq('fecha', fechaISO)
                .maybeSingle()
        ).pipe(
            switchMap(({ data: bloqueo }) => {
                if (bloqueo) {
                    return of({ disponible: false, error: 'El proveedor no se encuentra disponible en la fecha seleccionada.' });
                }

                // 1.3 Validar si ya existe una cita confirmada en esa misma fecha
                return from(
                    supabase.from('solicitudes')
                        .select('id')
                        .eq('proveedor_usuario_id', providerId)
                        .filter('fecha_servicio', 'gte', `${fechaISO}T00:00:00`)
                        .filter('fecha_servicio', 'lte', `${fechaISO}T23:59:59`)
                        .in('estado', ['confirmada', 'reservado', 'pagado', 'en_progreso'])
                        .maybeSingle()
                ).pipe(
                    map(({ data: cita }) => {
                        if (cita) {
                            return { disponible: false, error: 'Esta fecha ya ha sido reservada por otro servicio.' };
                        }
                        return { disponible: true };
                    })
                );
            }),
            catchError(err => {
                console.error('Error al consultar disponibilidad:', err);
                return of({ disponible: false, error: 'Error al validar la disponibilidad del proveedor.' });
            })
        );
    }

    /**
     * 2. Validación de Fechas Pasadas
     * Asegura que las fechas seleccionadas sean presentes o futuras.
     */
    validarFechaFutura(fecha: Date): boolean {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaSeleccionada = new Date(fecha);
        fechaSeleccionada.setHours(0, 0, 0, 0);
        return fechaSeleccionada >= hoy;
    }

    /**
     * 3. Regla de 24 Horas (SLA)
     * Si la cita es en menos de 24h, el proveedor tiene solo 3h para responder.
     * Guarda esta información como parte de los metadatos de la cita.
     */
    aplicarReglaSLA(fechaServicioISO: string): { horas_respuesta_max: number, es_urgente: boolean } {
        const ahora = new Date();
        const servicio = new Date(fechaServicioISO);

        // Diferencia en milisegundos convertida a horas
        const diffHoras = (servicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if (diffHoras < 24) {
            return {
                horas_respuesta_max: 3,
                es_urgente: true
            };
        }

        return {
            horas_respuesta_max: 24,
            es_urgente: false
        };
    }

    /**
     * 4. Gestión de Citas Vencidas
     * Detecta citas pasadas y las mueve automáticamente al estado "finalizada".
     */
    gestionarCitasVencidas(): Observable<any> {
        const supabase = this.supabaseService.getClient();
        const ahoraISO = new Date().toISOString();

        return from(
            supabase.from('solicitudes')
                .update({
                    estado: 'finalizada',
                    actualizado_en: ahoraISO
                })
                .lt('fecha_servicio', ahoraISO)
                .in('estado', ['confirmada', 'reservado', 'pagado', 'en_progreso'])
                .select()
        ).pipe(
            map(({ data, error }) => {
                if (error) {
                    console.error('Error al mover citas a finalizadas:', error);
                    return null;
                }
                return data;
            }),
            catchError(err => of(null))
        );
    }

    /**
     * Bloqueo Manual de Fechas
     * Permite que los proveedores administren su propia disponibilidad.
     */
    bloquearFechaManual(providerId: string, fechaISO: string, motivo: string = 'Bloqueo manual'): Observable<any> {
        const supabase = this.supabaseService.getClient();
        return from(
            supabase.from('disponibilidad_bloqueada').insert({
                provider_id: providerId,
                fecha: fechaISO,
                motivo: motivo
            }).select().single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            }),
            catchError(err => throwError(() => err))
        );
    }
}

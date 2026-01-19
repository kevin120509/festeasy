import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SupabaseDataService } from '../../services/supabase-data.service';

export interface SolicitudCliente {
    id: string;
    titulo_evento: string;
    categoria: string; // 'Música', 'Catering', etc. (Derivado o mock por ahora)
    fecha_evento: string; // ISO date
    creada_en: string; // ISO date
    estado: 'pendiente' | 'cotizando' | 'contratado' | 'finalizado';
    cotizaciones_count: number;
    imagen_url?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SolicitudesService {
    private auth = inject(AuthService);
    private supabaseData = inject(SupabaseDataService);

    // Obtener todas las solicitudes del cliente logueado
    getMisSolicitudes(): Observable<SolicitudCliente[]> {
        const user = this.auth.currentUser();
        if (!user || !user.id) return new Observable(obs => obs.next([]));

        return this.supabaseData.getRequestsByClient(user.id).pipe(
            map((requests: any[]) => {
                return requests.map(req => ({
                    id: req.id,
                    titulo_evento: req.titulo_evento || 'Evento Sin Título',
                    categoria: this.inferirCategoria(req),
                    fecha_evento: req.fecha_servicio,
                    creada_en: req.created_at || req.creado_en, // Supabase usa created_at
                    estado: this.mapearEstado(req.estado),
                    cotizaciones_count: 0, // TODO: Count real quotes
                    imagen_url: this.getImagenCategoria(this.inferirCategoria(req))
                }));
            })
        );
    }

    private inferirCategoria(req: any): string {
        // Lógica temporal para mostrar categorías bonitas en la UI
        // En el futuro esto vendría de una relación en DB
        const keywords = (req.titulo_evento || '').toLowerCase();
        if (keywords.includes('boda') || keywords.includes('dj')) return 'Música';
        if (keywords.includes('cena') || keywords.includes('comida')) return 'Catering';
        if (keywords.includes('salon') || keywords.includes('gala')) return 'Salón';
        return 'General';
    }

    private mapearEstado(estadoDb: string): 'pendiente' | 'cotizando' | 'contratado' | 'finalizado' {
        // Mapeo simple de estados de DB a estados de UI
        switch (estadoDb) {
            case 'pendiente_aprobacion': return 'pendiente';
            case 'esperando_anticipo': return 'cotizando'; // Asumimos que esperando anticipo es parte del proceso previo
            case 'reservado':
            case 'en_progreso':
            case 'entregado_pendiente_liq':
                return 'contratado';
            case 'finalizado':
            case 'rechazada':
            case 'cancelada':
            case 'abandonada':
                return 'finalizado';
            default: return 'pendiente';
        }
    }

    private getImagenCategoria(cat: string): string {
        // Retornar imágenes de placeholder bonitas según categoría
        switch (cat) {
            case 'Música': return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
            case 'Catering': return 'https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
            case 'Salón': return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
            default: return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
        }
    }
}

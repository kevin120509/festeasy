import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule, ProviderNavComponent],
    templateUrl: './notificaciones.html'
})
export class NotificacionesComponent {
    notificaciones = signal([
        {
            id: 1,
            tipo: 'solicitud',
            titulo: 'Nueva solicitud recibida',
            mensaje: 'María García solicita tu servicio para una boda el 15 de marzo',
            tiempo: 'Hace 2 horas',
            leida: false
        },
        {
            id: 2,
            tipo: 'pago',
            titulo: 'Pago confirmado',
            mensaje: 'Se ha confirmado el pago de $8,500 por el evento de Carlos López',
            tiempo: 'Hace 5 horas',
            leida: false
        },
        {
            id: 3,
            tipo: 'recordatorio',
            titulo: 'Evento mañana',
            mensaje: 'Recuerda que mañana tienes el evento de Ana Martínez a las 20:00',
            tiempo: 'Hace 1 día',
            leida: true
        },
        {
            id: 4,
            tipo: 'review',
            titulo: 'Nueva reseña',
            mensaje: 'Juan Pérez te ha dejado una reseña de 5 estrellas ⭐',
            tiempo: 'Hace 2 días',
            leida: true
        }
    ]);

    marcarLeida(id: number) {
        this.notificaciones.update(items =>
            items.map(n => n.id === id ? { ...n, leida: true } : n)
        );
    }

    getIcono(tipo: string): string {
        const iconos: Record<string, string> = {
            'solicitud': '📥',
            'pago': '💳',
            'recordatorio': '🔔',
            'review': '⭐'
        };
        return iconos[tipo] || '📢';
    }
}

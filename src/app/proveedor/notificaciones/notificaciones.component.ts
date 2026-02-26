import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notificaciones.html'
})
export class NotificacionesComponent implements OnInit {
    private notificationService = inject(NotificationService);
    notificaciones = this.notificationService.notifications;

    ngOnInit() {
        this.notificationService.getNotifications().subscribe();
    }

    marcarLeida(id: string) {
        this.notificationService.markAsRead(id).subscribe();
    }

    marcarTodasLeidas() {
        this.notificationService.markAllAsRead().subscribe();
    }

    formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return `Hace ${Math.floor(diffInSeconds / 86400)} d`;
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

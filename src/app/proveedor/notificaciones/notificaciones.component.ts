import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notificaciones.html'
})
export class NotificacionesComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private router = inject(Router);
    notificaciones = this.notificationService.notifications;

    // Estados interactivos
    notificationStyles = signal<Record<string, any>>({});
    touchStartX = 0;
    activeSwipeId = signal<string | null>(null);
    showMenuId = signal<string | null>(null);

    ngOnInit() {
        this.notificationService.getNotifications().subscribe();
    }

    marcarLeida(notif: Notification) {
        this.notificationService.markAsRead(notif.id).subscribe();
        this.showMenuId.set(null);

        if (notif.data?.solicitud_id) {
            this.router.navigate(['/proveedor/solicitudes', notif.data.solicitud_id]);
        }
    }

    marcarNoLeida(id: string, event?: Event) {
        if (event) event.stopPropagation();
        this.notificationService.markAsUnread(id).subscribe();
        this.showMenuId.set(null);
    }

    borrarNotificacion(id: string, event?: Event) {
        if (event) event.stopPropagation();
        this.notificationService.deleteNotification(id).subscribe({
            next: (success) => {
                if (!success) {
                    console.error('⚠️ La eliminación falló en el servidor. Verifica las políticas RLS.');
                }
            },
            error: (err) => {
                console.error('❌ Error al eliminar notificación:', err);
            }
        });
        this.showMenuId.set(null);
    }

    borrarTodas() {
        if (confirm('¿Estás seguro de que quieres borrar todas las notificaciones?')) {
            this.notificationService.deleteAllNotifications().subscribe();
        }
    }

    irAtras() {
        this.router.navigate(['/proveedor/dashboard']);
    }

    toggleMenu(id: string, event: Event) {
        event.stopPropagation();
        this.showMenuId.set(this.showMenuId() === id ? null : id);
    }

    /**
     * GESTOS DE SWIPE
     */
    onTouchStart(event: TouchEvent, id: string) {
        this.touchStartX = event.touches[0].clientX;
        this.activeSwipeId.set(id);
    }

    onTouchMove(event: TouchEvent, id: string) {
        const touchX = event.touches[0].clientX;
        const diff = touchX - this.touchStartX;

        if (Math.abs(diff) > 5) {
            this.notificationStyles.update(prev => ({
                ...prev,
                [id]: { transform: `translateX(${diff}px)` }
            }));
        }
    }

    onTouchEnd(event: TouchEvent, id: string) {
        const touchX = event.changedTouches[0].clientX;
        const diff = touchX - this.touchStartX;
        const threshold = 100;

        if (diff > threshold) {
            this.borrarNotificacion(id);
        } else if (diff < -threshold) {
            this.marcarNoLeida(id);
        }

        this.notificationStyles.update(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        this.activeSwipeId.set(null);
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

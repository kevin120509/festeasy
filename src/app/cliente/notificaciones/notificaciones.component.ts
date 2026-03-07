import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente-notificaciones',
  standalone: true,
  imports: [CommonModule, ListboxModule, ButtonModule, CardModule],
  templateUrl: './notificaciones.html',
  styleUrls: ['./notificaciones.css']
})
export class ClienteNotificacionesComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  notificaciones = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  // Estados interactivos
  notificationStyles = signal<Record<string, any>>({});
  touchStartX = 0;
  activeSwipeId = signal<string | null>(null);
  showMenuId = signal<string | null>(null);

  ngOnInit() {
    this.notificationService.getNotifications().subscribe();
  }

  // Devuelve la cantidad de notificaciones de tipo 'solicitud' que están pendientes
  get pendingSolicitudesCount(): number {
    return this.notificaciones().filter(n => !n.leida).length;
  }

  marcarLeida(notif: Notification) {
    this.notificationService.markAsRead(notif.id).subscribe();
    this.showMenuId.set(null);

    // Redirigir si la notificación tiene un ID de solicitud asociado
    if (notif.data?.solicitud_id) {
        this.router.navigate(['/cliente/solicitudes', notif.data.solicitud_id]);
    }
  }

  marcarNoLeida(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.notificationService.markAsUnread(id).subscribe();
    this.showMenuId.set(null);
  }

  borrarNotificacion(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe();
    this.showMenuId.set(null);
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

  marcarTodasComoLeidas() {
    this.notificationService.markAllAsRead().subscribe();
  }

  getIcono(tipo: string) {
    const map: Record<string, string> = {
      'recordatorio': 'pi pi-bell',
      'pago': 'pi pi-credit-card',
      'solicitud': 'pi pi-envelope',
      'cancelacion': 'pi pi-times-circle'
    };
    return map[tipo] || 'pi pi-bell';
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
}

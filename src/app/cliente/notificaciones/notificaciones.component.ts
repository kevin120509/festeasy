import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-cliente-notificaciones',
  standalone: true,
  imports: [CommonModule, ListboxModule, ButtonModule, CardModule],
  templateUrl: './notificaciones.html',
  styleUrls: ['./notificaciones.css']
})
export class ClienteNotificacionesComponent implements OnInit {
  private notificationService = inject(NotificationService);
  notificaciones = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  ngOnInit() {
    this.notificationService.getNotifications().subscribe();
  }

  // Devuelve la cantidad de notificaciones de tipo 'solicitud' que están pendientes
  get pendingSolicitudesCount(): number {
    return this.notificaciones().filter(n => !n.leida).length;
  }

  marcarLeida(id: string) {
    this.notificationService.markAsRead(id).subscribe();
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

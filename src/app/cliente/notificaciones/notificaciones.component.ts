import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-cliente-notificaciones',
  standalone: true,
  imports: [CommonModule, ListboxModule, ButtonModule, CardModule],
  templateUrl: './notificaciones.html',
  styleUrls: ['./notificaciones.css']
})
export class ClienteNotificacionesComponent {
  notificaciones = signal([
    { id: 1, tipo: 'recordatorio', titulo: 'Evento mañana', mensaje: 'Recuerda tu evento a las 20:00', tiempo: 'Hace 1 día', leida: false },
    { id: 2, tipo: 'pago', titulo: 'Pago recibido', mensaje: 'Tu pago fue procesado correctamente', tiempo: 'Hace 3 días', leida: true }
  ]);

  // Devuelve la cantidad de notificaciones de tipo 'solicitud' que están pendientes
  get pendingSolicitudesCount(): number {
    return this.notificaciones().filter(n => n.tipo === 'solicitud' && !n.leida).length;
  }

  marcarLeida(id: number) {
    this.notificaciones.update(items => items.map(n => n.id === id ? { ...n, leida: true } : n));
  }

  marcarTodasComoLeidas() {
    this.notificaciones.update(items => items.map(n => ({ ...n, leida: true })));
  }

  getIcono(tipo: string) {
    const map: Record<string,string> = {
      'recordatorio': 'pi pi-bell',
      'pago': 'pi pi-credit-card'
    };
    return map[tipo] || 'pi pi-bell';
  }
}

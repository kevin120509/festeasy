import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { DatePickerModule } from 'primeng/datepicker';
import localeEsMx from '@angular/common/locales/es-MX';
import { Router } from '@angular/router';

registerLocaleData(localeEsMx);

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class CalendarioComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  // Data
  allEvents = signal<any[]>([]);
  selectedDate = signal<Date>(new Date());
  loading = signal(false);

  // Computed
  selectedDateEvents = computed(() => {
    const sel = this.selectedDate();
    if (!sel) return [];

    const dateStr = this.formatDate(sel);
    const events = this.allEvents().filter(e => {
        if (!e.fecha_servicio) return false;
        // Tomar los primeros 10 caracteres
        const fechaBruta = String(e.fecha_servicio).substring(0, 10);
        return fechaBruta === dateStr;
    });

    // Ordenar por prioridad (reservados primero)
    events.sort((a, b) => {
        const getPriority = (estado: string) => {
            const st = estado?.toLowerCase();
            if (['reservado', 'confirmado', 'en_progreso', 'entregado_pendiente_liq'].includes(st)) return 1;
            if (st === 'en_negociacion') return 2;
            if (['esperando_anticipo', 'esperando_confirmacion_cliente'].includes(st)) return 3;
            return 4;
        };
        return getPriority(a.estado) - getPriority(b.estado);
    });

    return events;
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.api.getProviderRequestsReal().subscribe({
      next: (res) => {
        // Mappear los res del servidor a un formato predecible para el calendario
        const mappedEvents = res.map((req: any) => {
           const rawCliente = req.cliente || req.perfil_cliente;
           const clienteData = Array.isArray(rawCliente) ? rawCliente[0] : rawCliente;
           const nombreFinal = clienteData?.nombre_completo || clienteData?.nombre_negocio || clienteData?.nombre || req.cliente_nombre || 'Cliente';
           const avatarFinal = clienteData?.avatar_url || 'assets/default-avatar.png';

           return {
               ...req,
               nombre_cliente: nombreFinal,
               avatar_cliente: avatarFinal,
               hora_servicio: req.hora_servicio || req.hora_inicio || '12:00',
               num_invitados: req.num_invitados || req.asistentes || req.cantidad_personas || 50,
               titulo_evento: req.titulo_evento || req.servicio || 'Evento',
               estado_etiqueta: req.estado?.replace(/_/g, ' ') || 'pendiente'
           };
        });

        // Filtramos solo los eventos que tienen fecha y no han sido cancelados o rechazados
        this.allEvents.set(mappedEvents.filter((r: any) => r.fecha_servicio && !['cancelada', 'rechazada', 'abandonada'].includes(r.estado)));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading calendar events:', err);
        this.loading.set(false);
      }
    });
  }

  onDateSelect(event: any) {
    // PrimeNG DatePicker onSelect might return the date object directly or an event object
    const date = event instanceof Date ? event : (event.date || event);
    if (date instanceof Date) {
      this.selectedDate.set(date);
    }
  }

  getEventsForDate(date: any): any[] {
    if (!date) return [];
    // PrimeNG month es 0-indexado
    const m = date.month + 1;
    const dateStr = `${date.year}-${String(m).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    
    return this.allEvents().filter(e => {
        if (!e.fecha_servicio) return false;
        // Tomar los primeros 10 caracteres que corresponden a YYYY-MM-DD
        const fechaBruta = String(e.fecha_servicio).substring(0, 10);
        return fechaBruta === dateStr;
    });
  }

  goToEvent(eventId: string) {
    if (eventId) {
        this.router.navigate(['/proveedor/solicitudes', eventId]);
    }
  }

  isSelected(date: any): boolean {
    if (!date || !this.selectedDate()) return false;
    const sel = this.selectedDate();
    // PrimeNG date.month es 0 indexado
    return sel.getFullYear() === date.year && sel.getMonth() === date.month && sel.getDate() === date.day;
  }

  getDotColor(estado: string): string {
    switch(estado?.toLowerCase()) {
      case 'en_negociacion': return 'bg-amber-400';
      case 'reservado':
      case 'confirmado': 
      case 'en_progreso': 
      case 'entregado_pendiente_liq': return 'bg-green-500';
      case 'esperando_anticipo':
      case 'esperando_confirmacion_cliente': return 'bg-blue-400';
      default: return 'bg-slate-400';
    }
  }

  getBorderColor(estado: string): string {
    switch(estado?.toLowerCase()) {
      case 'en_negociacion': return 'border-l-amber-500';
      case 'reservado':
      case 'confirmado': 
      case 'en_progreso': 
      case 'entregado_pendiente_liq': return 'border-l-green-500';
      case 'esperando_anticipo':
      case 'esperando_confirmacion_cliente': return 'border-l-blue-500';
      default: return 'border-l-slate-400';
    }
  }

  getStateClasses(estado: string): string {
    switch(estado?.toLowerCase()) {
      case 'en_negociacion': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'reservado':
      case 'confirmado': 
      case 'en_progreso': 
      case 'entregado_pendiente_liq': return 'border-green-200 bg-green-50 text-green-700';
      case 'esperando_anticipo':
      case 'esperando_confirmacion_cliente': return 'border-blue-200 bg-blue-50 text-blue-700';
      default: return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  }

  hasEvent(date: any): boolean {
    return this.getEventsForDate(date).length > 0;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

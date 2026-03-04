import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { DatePickerModule } from 'primeng/datepicker';
import localeEsMx from '@angular/common/locales/es-MX';

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

  // Data
  allEvents = signal<any[]>([]);
  selectedDate = signal<Date>(new Date());
  loading = signal(false);

  // Computed
  selectedDateEvents = computed(() => {
    const sel = this.selectedDate();
    if (!sel) return [];

    const dateStr = this.formatDate(sel);
    return this.allEvents().filter(e => e.fecha_evento === dateStr);
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.api.getProviderRequests().subscribe({
      next: (res) => {
        // Filtramos solo los eventos que tienen fecha y están confirmados o reservados
        this.allEvents.set(res.filter(r => r.fecha_evento && (r.estado === 'confirmado' || r.estado === 'reservado')));
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

  hasEvent(date: any): boolean {
    if (!date) return false;
    // La estructura de 'date' en el template p-datepicker de PrimeNG es {year, month, day}
    const dateStr = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return this.allEvents().some(e => e.fecha_evento === dateStr);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

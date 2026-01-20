import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
interface CalendarDay {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    state: 'available' | 'occupied' | 'blocked';
    blockId?: string;
    events?: any[];
}

interface CalendarEvent {
    id: string;
    titulo_evento: string;
    fecha_servicio: string;
    direccion_servicio: string;
    estado: string;
    cliente?: {
        nombre_completo: string;
        telefono: string;
    };
}

@Component({
    selector: 'app-provider-calendar',
    standalone: true,
    imports: [CommonModule, HeaderComponent],
    templateUrl: './agenda.html',
    styleUrls: ['./agenda.component.css']
})
export class AgendaComponent implements OnInit {
    public supabaseData = inject(SupabaseDataService);
    public auth = inject(AuthService);
    private router = inject(Router);

    // State signals
    currentDate = signal(new Date());
    selectedDate = signal<Date | null>(null);
    calendarDays = signal<CalendarDay[]>([]);
    occupiedDates = signal<any[]>([]);
    blockedDates = signal<any[]>([]);
    eventsForSelectedDate = signal<CalendarEvent[]>([]);
    isLoading = signal(false);
    providerId = signal<string>('');

    // Computed values
    monthYear = computed(() => {
        const date = this.currentDate();
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    });

    formattedSelectedDate = computed(() => {
        const date = this.selectedDate();
        if (!date) return '';
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    });

    // Tomorrow's date for the "Mañana" section
    tomorrowDate = computed(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    });

    weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    async ngOnInit() {
        await this.loadProviderData();
        this.loadCalendarData();
    }

    async loadProviderData() {
        try {
            const user = await this.auth.currentUser();
            if (user?.id) {
                this.providerId.set(user.id);
            }
        } catch (error) {
            console.error('Error loading provider data:', error);
        }
    }

    loadCalendarData() {
        const providerId = this.providerId();
        if (!providerId) return;

        this.isLoading.set(true);

        forkJoin({
            occupied: this.supabaseData.getOccupiedDates(providerId).pipe(
                catchError(err => {
                    console.error('Error loading occupied dates:', err);
                    return of([]);
                })
            ),
            blocked: this.supabaseData.getBlockedDates(providerId).pipe(
                catchError(err => {
                    console.error('Error loading blocked dates:', err);
                    return of([]);
                })
            )
        }).subscribe({
            next: ({ occupied, blocked }) => {
                this.occupiedDates.set(occupied);
                this.blockedDates.set(blocked);
                this.generateCalendar();
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading calendar data:', err);
                this.isLoading.set(false);
            }
        });
    }

    generateCalendar() {
        const current = this.currentDate();
        const year = current.getFullYear();
        const month = current.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
        // We need to adjust so Monday = 0
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek < 0) firstDayOfWeek = 6;

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add days from previous month
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push(this.createCalendarDay(date, false));
        }

        // Add days of current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            days.push(this.createCalendarDay(date, true));
        }

        // Add days from next month to complete the grid
        const remainingDays = 7 - (days.length % 7);
        if (remainingDays < 7) {
            for (let day = 1; day <= remainingDays; day++) {
                const date = new Date(year, month + 1, day);
                days.push(this.createCalendarDay(date, false));
            }
        }

        this.calendarDays.set(days);
    }

    createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
        const dateString = date.toISOString().split('T')[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Check if date is occupied
        const isOccupied = this.occupiedDates().some(event =>
            event.fecha_servicio.startsWith(dateString)
        );

        // Check if date is blocked
        const blockedDate = this.blockedDates().find(block =>
            block.fecha === dateString
        );
        const isBlocked = !!blockedDate;

        // Determine state
        let state: 'available' | 'occupied' | 'blocked' = 'available';
        if (isOccupied) state = 'occupied';
        else if (isBlocked) state = 'blocked';

        // Check if selected
        const selected = this.selectedDate();
        const isSelected = selected ?
            selected.getDate() === date.getDate() &&
            selected.getMonth() === date.getMonth() &&
            selected.getFullYear() === date.getFullYear() : false;

        return {
            date,
            dayNumber: date.getDate(),
            isCurrentMonth,
            isToday: normalizedDate.getTime() === today.getTime(),
            isSelected,
            state,
            blockId: blockedDate?.id
        };
    }

    selectDate(day: CalendarDay) {
        this.selectedDate.set(day.date);

        // Refresh calendar to update selection
        this.generateCalendar();

        // Load events for selected date
        this.loadEventsForDate(day.date);
    }

    loadEventsForDate(date: Date) {
        const providerId = this.providerId();
        if (!providerId) return;

        this.supabaseData.getEventsForDate(providerId, date).subscribe({
            next: (events) => {
                this.eventsForSelectedDate.set(events);
            },
            error: (err) => {
                console.error('Error loading events for date:', err);
                this.eventsForSelectedDate.set([]);
            }
        });
    }

    async blockDateManually() {
        const date = this.selectedDate();
        if (!date) return;

        const providerId = this.providerId();
        if (!providerId) return;

        try {
            await this.supabaseData.blockDate(providerId, date, 'Bloqueo manual');
            // Refresh calendar
            this.loadCalendarData();
        } catch (error) {
            console.error('Error blocking date:', error);
            alert('Error al bloquear la fecha. Por favor, intenta de nuevo.');
        }
    }

    async unblockDate(blockId: string) {
        try {
            await this.supabaseData.unblockDate(blockId);
            // Refresh calendar
            this.loadCalendarData();
        } catch (error) {
            console.error('Error unblocking date:', error);
            alert('Error al desbloquear la fecha. Por favor, intenta de nuevo.');
        }
    }

    previousMonth() {
        const current = this.currentDate();
        const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        this.currentDate.set(newDate);
        this.generateCalendar();
    }

    nextMonth() {
        const current = this.currentDate();
        const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        this.currentDate.set(newDate);
        this.generateCalendar();
    }

    formatEventTime(fechaServicio: string): string {
        const date = new Date(fechaServicio);
        const start = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        // For now, we'll show a default end time. You can modify this based on your data
        const endDate = new Date(date.getTime() + 4 * 60 * 60 * 1000); // +4 hours
        const end = endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${start} - ${end}`;
    }

    viewRequestDetails(requestId: string) {
        this.router.navigate(['/proveedor/solicitudes', requestId]);
    }

    syncWithGoogleCalendar() {
        // TODO: Implement Google Calendar OAuth integration
        alert('Función de sincronización con Google Calendar próximamente disponible.');
    }

    getDayClasses(day: CalendarDay): { [key: string]: boolean } {
        return {
            'calendar-day': true,
            'current-month': day.isCurrentMonth,
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': day.isSelected,
            'available': day.state === 'available',
            'occupied': day.state === 'occupied',
            'blocked': day.state === 'blocked'
        };
    }
}

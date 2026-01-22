
import { Component, signal, inject, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SupabaseDataService } from '../../services/supabase-data.service';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { CalendarioFechaService } from '../../services/calendario-fecha.service';
import { computed } from '@angular/core';

interface Day {
    num: number;
    disponible: boolean;
    blockId?: string;
    events?: any[];
}

/**
 * Interface for calendar events from Supabase 'solicitudes' table
 * Represents a confirmed service request
 */
interface CalendarEvent {
    id: string;
    titulo_evento: string;
    fecha_servicio: string;  // ISO 8601 format: '2023-10-16T10:00:00'
    direccion_servicio: string;
    estado: 'Pagado' | 'Confirmado' | 'Reservado' | 'pagado' | 'reservado';
    perfil_cliente?: {
        nombre_completo: string;
        telefono: string;
    };
    // Additional fields that might come from Supabase
    created_at?: string;
    proveedor_usuario_id?: string;
}

interface CalendarDay {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    state: 'available' | 'occupied' | 'blocked';
    blockId?: string;
}


@Component({
    selector: 'app-agenda',
    standalone: true,
    imports: [],
    templateUrl: './agenda.html'
})
export class AgendaComponent implements OnInit {
    public supabaseData = inject(SupabaseDataService);
    public auth = inject(SupabaseAuthService);
    private calService = inject(CalendarioFechaService);
    private router = inject(Router);

    // State signals with strict typing
    currentDate = signal<Date>(new Date());
    selectedDate = signal<Date | null>(null);
    calendarDays = signal<CalendarDay[]>([]);
    occupiedDates = signal<CalendarEvent[]>([]);  // Strictly typed as CalendarEvent[]
    blockedDates = signal<any[]>([]);
    eventsForSelectedDate = signal<CalendarEvent[]>([]);
    selectedEvents = signal<CalendarEvent[]>([]);  // For details panel
    isLoading = signal<boolean>(false);
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

    async ngOnInit(): Promise<void> {
        await this.loadProviderData();
        this.calService.gestionarCitasVencidas().subscribe(); // Limpieza automática
        this.loadProviderEvents();  // Load events with strict status filters
    }

    /**
     * Loads the provider data from authenticated user
     * Sets the providerId signal for calendar filtering
     */
    async loadProviderData(): Promise<void> {
        try {
            const user = await this.auth.getCurrentUser();
            if (user?.id) {
                this.providerId.set(user.id);
                console.log(`✅ Provider authenticated: ${user.id}`);
            } else {
                console.warn('⚠️  No authenticated user found');
                this.router.navigate(['/login']);
            }
        } catch (error) {
            console.error('❌ Error loading provider data:', error);
            this.router.navigate(['/login']);
        }
    }

    /**
     * 🎯 BUSINESS LOGIC: Load Provider Events
     * Queries 'solicitudes' table for events with status 'Pagado' or 'Confirmado'
     * Also loads manually blocked dates from 'disponibilidad_bloqueada'
     * This is the main function that populates the calendar with red dots (occupied dates)
     */
    loadProviderEvents(): void {
        const providerId = this.providerId();
        if (!providerId) {
            console.warn('⚠️  Cannot load events: no provider ID');
            return;
        }

        this.isLoading.set(true);
        console.log(`🔄 Loading events for provider: ${providerId}`);

        // Load both confirmed events AND blocked dates in parallel for performance
        forkJoin({
            occupied: this.supabaseData.getOccupiedDates(providerId).pipe(
                catchError(err => {
                    console.error('❌ Error loading occupied dates:', err);
                    return of([]);
                })
            ),
            blocked: this.supabaseData.getBlockedDates(providerId).pipe(
                catchError(err => {
                    console.error('❌ Error loading blocked dates:', err);
                    return of([]);
                })
            )
        }).subscribe({
            next: ({ occupied, blocked }) => {
                // Type assertion for strict TypeScript compliance
                const typedEvents = occupied as CalendarEvent[];

                console.log(`✅ Loaded ${typedEvents.length} occupied dates (Pagado/Confirmado)`);
                console.log(`✅ Loaded ${blocked.length} manually blocked dates`);

                // Update signals with fetched data
                this.occupiedDates.set(typedEvents);
                this.blockedDates.set(blocked);

                // Generate calendar grid with marked dates (🔴 red dots)
                this.generateCalendar();

                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('❌ Fatal error loading calendar data:', err);
                this.isLoading.set(false);
            }
        });
    }

    /**
     * Generates the calendar grid for the current month
     * Includes days from previous and next month to fill the grid
     */
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

    /**
     * Creates a CalendarDay object with all necessary state
     * @param date - The date for this calendar day
     * @param isCurrentMonth - Whether this date belongs to the current month
     * @returns CalendarDay object with computed state
     */
    createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
        const dateString = date.toISOString().split('T')[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Check if date is occupied (has confirmed events)
        const isOccupied = this.occupiedDates().some(event =>
            event.fecha_servicio.startsWith(dateString)
        );

        // Check if date is manually blocked
        const blockedDate = this.blockedDates().find(block =>
            block.fecha === dateString
        );
        const isBlocked = !!blockedDate;

        // Determine state priority: occupied > blocked > available
        let state: 'available' | 'occupied' | 'blocked' = 'available';
        if (isOccupied) state = 'occupied';
        else if (isBlocked) state = 'blocked';

        // Check if this date is currently selected
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

    /**
     * 🖱️ USER INTERACTION: Handles date selection in the calendar
     * Updates the selected date and loads events for that date
     * Updates selectedEvents signal for the "Detalles del Día" panel
     */
    selectDate(day: CalendarDay): void {
        this.selectedDate.set(day.date);

        // Refresh calendar to update selection state (visual feedback)
        this.generateCalendar();

        // Load events for the selected date and update details panel
        this.loadEventsForDate(day.date);
    }

    /**
     * 📊 DATA LOADING: Loads all events for a specific date
     * Updates eventsForSelectedDate AND selectedEvents signals
     * This data is displayed in the "Detalles del Día" panel
     */
    loadEventsForDate(date: Date): void {
        const providerId = this.providerId();
        if (!providerId) {
            console.warn('⚠️  Cannot load events: no provider ID');
            return;
        }

        this.supabaseData.getEventsForDate(providerId, date).subscribe({
            next: (events) => {
                const typedEvents = events as CalendarEvent[];
                console.log(`📅 Loaded ${typedEvents.length} event(s) for ${date.toLocaleDateString('es-ES')}`);

                // Update both signals for template usage
                this.eventsForSelectedDate.set(typedEvents);
                this.selectedEvents.set(typedEvents);  // For details panel
            },
            error: (err) => {
                console.error('❌ Error loading events for date:', err);
                this.eventsForSelectedDate.set([]);
                this.selectedEvents.set([]);
            }
        });
    }

    async blockDateManually(): Promise<void> {
        const date = this.selectedDate();
        if (!date) {
            console.warn('⚠️  No date selected for blocking');
            return;
        }

        const providerId = this.providerId();
        if (!providerId) {
            console.warn('⚠️  No provider ID');
            return;
        }

        try {
            const dateISO = date.toISOString().split('T')[0];
            await firstValueFrom(this.calService.bloquearFechaManual(providerId, dateISO));
            console.log(`✅ Date blocked successfully: ${date.toLocaleDateString('es-ES')}`);
            // Refresh calendar to show the blocked date
            this.loadProviderEvents();
        } catch (error) {
            console.error('❌ Error blocking date:', error);
            alert('Error al bloquear la fecha. Por favor, intenta de nuevo.');
        }
    }

    async unblockDate(blockId: string): Promise<void> {
        if (!blockId) {
            console.warn('⚠️  No block ID provided');
            return;
        }

        try {
            await this.supabaseData.unblockDate(blockId);
            console.log(`✅ Date unblocked successfully`);
            // Refresh calendar to remove the blocked status
            this.loadProviderEvents();
        } catch (error) {
            console.error('❌ Error unblocking date:', error);
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
}

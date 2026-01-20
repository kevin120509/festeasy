import { Component, signal, inject, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';
import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';

interface Day {
    num: number;
    disponible: boolean;
    blockId?: string;
    isToday?: boolean;
}

@Component({
    selector: 'app-agenda',
    standalone: true,
    imports: [ProviderNavComponent],
    templateUrl: './agenda.html'
})
export class AgendaComponent implements OnInit {
    private api = inject(ApiService);

    currentDate = new Date();
    currentMonth = signal(this.currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }));
    dias = signal<Day[]>([]);
    eventosProximos = signal<any[]>([]);

    ngOnInit(): void {
        this.loadMonthData();
    }

    loadMonthData(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        forkJoin({
            blocks: this.api.getCalendarBlocks(),
            requests: this.api.getProviderRequests()
        }).subscribe(({ blocks, requests }) => {
            const acceptedRequests = requests.filter((r: any) => r.estado === 'reservado');
            this.generateCalendar(year, month, blocks, acceptedRequests);

            const proximos = acceptedRequests
                .map((r: any) => ({
                    fecha: new Date(r.fecha_servicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                    cliente: `Cliente ID: ${r.cliente_usuario_id}`,
                    tipo: r.titulo_evento || 'Evento',
                    hora: new Date(r.fecha_servicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                }))
                .slice(0, 3); // Show first 3
            this.eventosProximos.set(proximos);
        });
    }

    generateCalendar(year: number, month: number, blocks: any[], requests: any[]): void {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const calendarDays: Day[] = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = date.toISOString().split('T')[0];

            const block = blocks.find(b => b.fecha === dateString);
            const request = requests.find(r => r.fecha_servicio.startsWith(dateString));

            calendarDays.push({
                num: i,
                disponible: !block && !request,
                blockId: block?.id,
                isToday: date.toDateString() === today.toDateString()
            });
        }
        this.dias.set(calendarDays);
    }

    toggleDisponibilidad(index: number): void {
        const day = this.dias()[index];
        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day.num);
        const dateString = date.toISOString().split('T')[0];

        if (day.disponible) {
            // Block the day
            this.api.createCalendarBlock({ fecha: dateString }).subscribe((newBlock: any) => {
                this.dias.update(dias => dias.map((d, i) => i === index ? { ...d, disponible: false, blockId: newBlock.id } : d));
            });
        } else if (day.blockId) {
            // Unblock the day
            this.api.deleteCalendarBlock(day.blockId).subscribe(() => {
                this.dias.update(dias => dias.map((d, i) => i === index ? { ...d, disponible: true, blockId: undefined } : d));
            });
        }
        // If it's an event day, do nothing.
    }

    changeMonth(offset: number): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + offset);
        this.currentMonth.set(this.currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }));
        this.loadMonthData();
    }
}

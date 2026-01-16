import { Component, signal } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-agenda',
    standalone: true,
    imports: [HeaderComponent],
    templateUrl: './agenda.html'
})
export class AgendaComponent {
    currentMonth = signal('Enero 2026');

    dias = signal([
        { num: 1, disponible: true }, { num: 2, disponible: true }, { num: 3, disponible: false },
        { num: 4, disponible: false }, { num: 5, disponible: true }, { num: 6, disponible: true },
        { num: 7, disponible: true }, { num: 8, disponible: true }, { num: 9, disponible: true },
        { num: 10, disponible: false }, { num: 11, disponible: true }, { num: 12, disponible: true },
        { num: 13, disponible: true }, { num: 14, disponible: true }, { num: 15, disponible: false },
        { num: 16, disponible: true }, { num: 17, disponible: false }, { num: 18, disponible: true },
        { num: 19, disponible: true }, { num: 20, disponible: true }, { num: 21, disponible: true },
        { num: 22, disponible: true }, { num: 23, disponible: true }, { num: 24, disponible: false },
        { num: 25, disponible: true }, { num: 26, disponible: true }, { num: 27, disponible: true },
        { num: 28, disponible: true }, { num: 29, disponible: true }, { num: 30, disponible: true },
        { num: 31, disponible: false }
    ]);

    eventosProximos = signal([
        { fecha: '3 Ene', cliente: 'María García', tipo: 'Boda', hora: '18:00' },
        { fecha: '10 Ene', cliente: 'Carlos López', tipo: 'Corporativo', hora: '10:00' },
        { fecha: '15 Ene', cliente: 'Ana Martínez', tipo: 'Cumpleaños', hora: '20:00' }
    ]);

    toggleDisponibilidad(index: number) {
        this.dias.update(dias =>
            dias.map((d, i) => i === index ? { ...d, disponible: !d.disponible } : d)
        );
    }
}

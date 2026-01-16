import { Component, signal } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [HeaderComponent],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent {
    solicitudes = signal([
        {
            id: 1,
            cliente: 'María García',
            evento: 'Boda',
            fecha: '15 Mar 2026',
            paquete: 'Paquete Premium DJ',
            precio: 8500,
            tiempoRestante: '04:42:05',
            estado: 'pendiente'
        },
        {
            id: 2,
            cliente: 'Carlos López',
            evento: 'Corporativo',
            fecha: '28 Feb 2026',
            paquete: 'Paquete Completo',
            precio: 12000,
            tiempoRestante: '18:30:00',
            estado: 'pendiente'
        },
        {
            id: 3,
            cliente: 'Ana Martínez',
            evento: 'Cumpleaños',
            fecha: '10 Feb 2026',
            paquete: 'Paquete Básico',
            precio: 5000,
            tiempoRestante: null,
            estado: 'confirmado'
        }
    ]);

    aceptar(id: number) {
        this.solicitudes.update(items =>
            items.map(s => s.id === id ? { ...s, estado: 'confirmado', tiempoRestante: null } : s)
        );
    }

    rechazar(id: number) {
        this.solicitudes.update(items => items.filter(s => s.id !== id));
    }
}

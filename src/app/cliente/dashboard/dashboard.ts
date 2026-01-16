import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-cliente-dashboard',
    standalone: true,
    imports: [RouterLink, HeaderComponent],
    templateUrl: './dashboard.html'
})
export class ClienteDashboardComponent {
    auth = inject(AuthService);

    eventos = signal([
        { id: 1, nombre: 'Boda Javier & Elena', fecha: '15 Mar 2026', progreso: 75, estado: 'En proceso' },
        { id: 2, nombre: 'Cumpleaños María', fecha: '20 Feb 2026', progreso: 40, estado: 'Planificando' }
    ]);

    solicitudes = signal([
        { id: 1, proveedor: 'Sonic Audio Visuals', servicio: 'DJ Premium', estado: 'Confirmado', precio: 8500 },
        { id: 2, proveedor: 'Delicias Gourmet', servicio: 'Catering 50 pax', estado: 'Pendiente', precio: 12000 },
        { id: 3, proveedor: 'Foto Momentos', servicio: 'Fotografía 6hrs', estado: 'Confirmado', precio: 5500 }
    ]);

    presupuesto = signal({
        total: 50000,
        gastado: 26000,
        categorias: [
            { nombre: 'Música', porcentaje: 30, color: '#E53935' },
            { nombre: 'Catering', porcentaje: 40, color: '#FF7043' },
            { nombre: 'Foto', porcentaje: 20, color: '#FFC107' },
            { nombre: 'Otros', porcentaje: 10, color: '#757575' }
        ]
    });
}

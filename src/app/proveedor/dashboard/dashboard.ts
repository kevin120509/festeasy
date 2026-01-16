import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-proveedor-dashboard',
    standalone: true,
    imports: [RouterLink, HeaderComponent],
    templateUrl: './dashboard.html'
})
export class ProveedorDashboardComponent {
    auth = inject(AuthService);

    metricas = signal({
        ticketPromedio: 12500,
        ingresosMes: 145000,
        rating: 4.9,
        crecimiento: 15
    });

    serviciosPopulares = signal([
        { nombre: 'Paquete Premium', porcentaje: 45, color: '#E53935' },
        { nombre: 'Paquete Básico', porcentaje: 30, color: '#FF7043' },
        { nombre: 'Extras', porcentaje: 25, color: '#FFC107' }
    ]);

    clientesRecurrentes = signal([
        { nombre: 'María García', eventos: 5, ultimoEvento: 'Hace 2 semanas' },
        { nombre: 'Carlos López', eventos: 3, ultimoEvento: 'Hace 1 mes' },
        { nombre: 'Ana Martínez', eventos: 2, ultimoEvento: 'Hace 3 meses' }
    ]);

    ingresosMensuales = signal([
        { mes: 'Sep', valor: 85000 },
        { mes: 'Oct', valor: 92000 },
        { mes: 'Nov', valor: 125000 },
        { mes: 'Dic', valor: 145000 }
    ]);
}

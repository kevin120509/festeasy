import { Component, signal, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header';
import { ApiService } from '../../services/api.service';
import { ServiceRequest } from '../../models';

@Component({
    selector: 'app-solicitudes',
    standalone: true,
    imports: [HeaderComponent],
    templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
    private api = inject(ApiService);

    solicitudes = signal<any[]>([]);

    ngOnInit(): void {
        this.api.getProviderRequests().subscribe(requests => {
            const mappedSolicitudes = requests.map(req => ({
                id: req.id,
                // TODO: Populate with real data
                cliente: `Cliente ID: ${req.cliente_usuario_id}`,
                evento: req.titulo_evento || 'Evento sin título',
                fecha: new Date(req.fecha_servicio).toLocaleDateString(),
                paquete: 'Paquete no especificado',
                precio: 0, // Comes from quote,
                tiempoRestante: '00:00:00', // Placeholder
                estado: req.estado
            }));
            this.solicitudes.set(mappedSolicitudes);
        });
    }

    aceptar(id: string) {
        this.api.updateRequestStatus(id.toString(), 'aceptada').subscribe(() => {
            this.solicitudes.update(items =>
                items.map(s => s.id === id ? { ...s, estado: 'aceptada', tiempoRestante: null } : s)
            );
        });
    }

    rechazar(id: string) {
        this.api.updateRequestStatus(id.toString(), 'rechazada').subscribe(() => {
            this.solicitudes.update(items => items.filter(s => s.id !== id));
        });
    }
}

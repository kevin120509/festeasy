import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-crear-evento',
    standalone: true,
    imports: [CommonModule, FormsModule, HeaderComponent],
    templateUrl: './crear-evento.component.html'
})
export class CrearEventoComponent {
    router = inject(Router);

    // Datos del evento
    titulo = '';
    fecha = '';
    hora = '12:00';
    ubicacion = '';
    invitados = 50;
    descripcion = '';

    // Estado
    isLoading = false;
    error = '';

    buscarProveedores() {
        if (!this.titulo || !this.fecha || !this.hora || !this.ubicacion) {
            this.error = 'Por favor completa todos los campos obligatorios';
            return;
        }

        // Guardar datos del evento en sessionStorage para usarlos después
        const eventoData = {
            titulo: this.titulo,
            fecha: this.fecha,
            hora: this.hora,
            ubicacion: this.ubicacion,
            invitados: this.invitados,
            descripcion: this.descripcion
        };
        sessionStorage.setItem('eventoActual', JSON.stringify(eventoData));

        // Navegar al marketplace para ver proveedores cercanos
        this.router.navigate(['/cliente/marketplace']);
    }
}

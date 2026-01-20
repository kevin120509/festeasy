import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-crear-evento',
    standalone: true,
    imports: [CommonModule, FormsModule],
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
    isLocating = false;
    error = '';

    usarUbicacionActual() {
        if (!navigator.geolocation) {
            alert('La geolocalización no está soportada por tu navegador.');
            return;
        }

        this.isLocating = true;
        this.error = '';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.ubicacion = `Ubicación actual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                this.isLocating = false;
            },
            (err) => {
                console.error('Error obteniendo ubicación:', err);
                let msg = 'No se pudo obtener tu ubicación.';
                if (err.code === 1) msg = 'Permiso de ubicación denegado.';
                if (err.code === 3) msg = 'Tiempo de espera agotado al obtener ubicación.';
                
                this.error = msg + ' Por favor ingrésala manualmente.';
                this.isLocating = false;
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

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

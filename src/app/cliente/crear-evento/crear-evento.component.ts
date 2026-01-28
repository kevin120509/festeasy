import { Component, inject, signal, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GeoService } from '../../services/geo.service';

@Component({
    selector: 'app-crear-evento',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './crear-evento.component.html'
})
export class CrearEventoComponent implements OnInit {
    router = inject(Router);
    api = inject(ApiService);
    ngZone = inject(NgZone);
    geo = inject(GeoService);
    cdr = inject(ChangeDetectorRef);

    // Datos del evento
    titulo = '';
    fecha = '';
    horaInicio = '12:00';
    ubicacion = '';
    invitados = 50;
    categoriaId = '';

    categorias = signal<any[]>([]);
    loadingCategories = signal(true);

    // Geolocalización
    coordenadas: { lat: number, lng: number } | null = null;

    // Estado
    isLoading = false;
    isLocating = false;
    error = '';

    ngOnInit() {
        this.api.getServiceCategories().subscribe({
            next: (cats) => {
                // Filtrar duplicados por nombre
                const uniqueCats = (cats || []).filter((cat, index, self) =>
                    index === self.findIndex((t) => t.nombre === cat.nombre)
                );
                this.categorias.set(uniqueCats);
                this.loadingCategories.set(false);
            },
            error: (err) => {
                console.error('Error cargando categorías', err);
                this.loadingCategories.set(false);
            }
        });
    }

    onCategoryChange() {
        // Forzar detección de cambios para feedback inmediato
        this.cdr.detectChanges();
    }

    usarUbicacionActual() {
        this.isLocating = true;
        this.error = '';

        this.geo.getCurrentLocation().subscribe({
            next: (data) => {
                this.ngZone.run(() => {
                    this.coordenadas = { lat: data.lat, lng: data.lng };
                    // Usar la dirección formateada que incluye colonia, calle, etc.
                    this.ubicacion = data.formatted_address || `Ubicación detectada (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`;
                    this.isLocating = false;
                    this.cdr.detectChanges(); // Forzar actualización de vista
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error('Error obteniendo ubicación:', err);
                    this.error = (typeof err === 'string' ? err : 'No se pudo obtener tu ubicación.') + ' Por favor ingrésala manualmente.';
                    this.isLocating = false;
                    this.cdr.detectChanges();
                });
            }
        });
    }

    buscarProveedores() {
        if (!this.titulo || !this.fecha || !this.horaInicio || !this.ubicacion || !this.categoriaId) {
            this.error = 'Por favor completa todos los campos obligatorios.';
            return;
        }

        // VALIDACIÓN DE FECHA PASADA
        const fechaSeleccionada = new Date(this.fecha + 'T' + this.horaInicio);
        const hoy = new Date();
        if (fechaSeleccionada < hoy) {
            this.error = 'No puedes agendar un evento en el pasado. Por favor selecciona una fecha válida.';
            return;
        }

        if (this.isLoading) return;
        this.isLoading = true;

        // Guardar datos del evento en sessionStorage para usarlos después
        const eventoData = {
            titulo: this.titulo,
            fecha: this.fecha,
            horaInicio: this.horaInicio,
            ubicacion: this.ubicacion,
            invitados: this.invitados,
            categoriaId: this.categoriaId,
            coords: this.coordenadas // { lat, lng } o null
        };
        sessionStorage.setItem('eventoActual', JSON.stringify(eventoData));

        // Navegar al marketplace para ver proveedores cercanos
        this.router.navigate(['/cliente/marketplace']).then(() => {
            this.isLoading = false;
        });

    }
}

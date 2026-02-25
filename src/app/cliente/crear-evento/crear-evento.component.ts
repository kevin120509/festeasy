import { Component, inject, signal, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GeoService } from '../../services/geo.service';
import { SolicitudDataService } from '../../services/solicitud-data.service';
import { Subject, debounceTime } from 'rxjs';

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
    solicitudData = inject(SolicitudDataService);

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

    private saveSubject = new Subject<void>();

    ngOnInit() {
        // Restaurar datos desde el servicio (que ya cargó de localStorage)
        const data = this.solicitudData.getEventoActual();
        if (data) {
            this.titulo = data.titulo || '';
            this.fecha = data.fecha || '';
            this.horaInicio = data.horaInicio || '12:00';
            this.ubicacion = data.ubicacion || '';
            this.invitados = data.invitados || 50;
            this.categoriaId = data.categoriaId || '';
            this.coordenadas = data.coords || null;
        }

        this.api.getServiceCategories().subscribe({
            next: (cats) => {
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

        // Setup debounced save
        this.saveSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.executeSave();
        });
    }

    saveToStorage() {
        this.saveSubject.next();
    }

    private executeSave() {
        const eventoData = {
            titulo: this.titulo,
            fecha: this.fecha,
            horaInicio: this.horaInicio,
            ubicacion: this.ubicacion,
            invitados: this.invitados,
            categoriaId: this.categoriaId,
            coords: this.coordenadas
        };
        this.solicitudData.setEventoActual(eventoData);
    }

    onCategoryChange() {
        this.saveToStorage();
        this.cdr.detectChanges();
    }

    usarUbicacionActual() {
        this.isLocating = true;
        this.error = '';

        this.geo.getCurrentLocation().subscribe({
            next: (data) => {
                this.ngZone.run(() => {
                    this.coordenadas = { lat: data.lat, lng: data.lng };
                    this.ubicacion = data.formatted_address || `Ubicación detectada (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`;
                    this.isLocating = false;
                    this.saveToStorage(); // Guardar al detectar ubicación
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
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

        const fechaSeleccionada = new Date(this.fecha + 'T' + this.horaInicio);
        const hoy = new Date();
        if (fechaSeleccionada < hoy) {
            this.error = 'No puedes agendar un evento en el pasado. Por favor selecciona una fecha válida.';
            return;
        }

        if (this.isLoading) return;
        this.isLoading = true;

        this.saveToStorage();

        this.router.navigate(['/marketplace']).then(() => {
            this.isLoading = false;
        });
    }
}

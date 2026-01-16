import { Component, signal } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-proveedor-detalle',
    standalone: true,
    imports: [HeaderComponent],
    templateUrl: './proveedor-detalle.html'
})
export class ProveedorDetalleComponent {
    provider = signal({
        id: 1,
        nombre: 'Sonic Audio Visuals',
        categoria: 'DJ / Sonido',
        descripcion: 'Somos expertos en crear la atmósfera perfecta para tu evento con la mejor música y equipo de sonido profesional. Más de 10 años de experiencia en bodas, fiestas corporativas y eventos sociales.',
        rating: 4.9,
        ubicacion: 'Ciudad de México',
        imagen: '🎧',
        reviews: 127
    });

    packages = signal([
        { id: 1, nombre: 'Paquete Básico', descripcion: 'DJ por 4 horas + equipo básico', precio: 5000 },
        { id: 2, nombre: 'Paquete Premium', descripcion: 'DJ por 6 horas + iluminación LED', precio: 8500 },
        { id: 3, nombre: 'Paquete Completo', descripcion: 'DJ + iluminación + cabina de fotos', precio: 12000 }
    ]);

    galeria = ['🎵', '🎶', '🎤', '🔊'];

    reviews = signal([
        { autor: 'María G.', rating: 5, comentario: 'Excelente servicio, la fiesta fue increíble!', fecha: '15 Dic 2025' },
        { autor: 'Carlos R.', rating: 5, comentario: 'Muy profesionales y puntuales.', fecha: '10 Dic 2025' }
    ]);

    addToCart(pkg: any) {
        alert(`${pkg.nombre} agregado al carrito`);
    }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ResenasService } from '../../../../core/services/resenas.service';

@Component({
    selector: 'app-resena-exito',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './resena-exito.component.html',
    styleUrls: ['./resena-exito.component.css']
})
export class ResenaExitoComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private resenasService = inject(ResenasService);

    solicitudesRestantes = signal(0);

    ngOnInit() {
        // Opcional: cargar si faltan más reseñas por hacer
    }

    cerrar() {
        this.router.navigate(['/cliente/dashboard']);
    }

    verOtros() {
        this.router.navigate(['/cliente/resenas/resumen']);
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-resena-exito',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './resena-exito.component.html',
    styleUrls: ['./resena-exito.component.css']
})
export class ResenaExitoComponent {
    private router = inject(Router);

    cerrar() {
        this.router.navigate(['/cliente/dashboard']);
    }
}

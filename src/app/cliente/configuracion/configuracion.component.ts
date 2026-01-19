import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header';

@Component({
    selector: 'app-cliente-configuracion',
    standalone: true,
    imports: [CommonModule, HeaderComponent],
    templateUrl: './configuracion.component.html'
})
export class ClienteConfiguracionComponent { }

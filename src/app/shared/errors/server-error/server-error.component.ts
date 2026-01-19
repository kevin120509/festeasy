import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-server-error',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './server-error.component.html',
    styleUrl: './server-error.component.css'
})
export class ServerErrorComponent {}

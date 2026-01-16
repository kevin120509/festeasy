import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterLink, HeaderComponent],
    templateUrl: './landing.html'
})
export class LandingComponent { }

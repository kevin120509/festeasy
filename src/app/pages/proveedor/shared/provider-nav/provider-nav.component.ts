import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-provider-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './provider-nav.component.html',
  styleUrls: ['./provider-nav.component.css']
})
export class ProviderNavComponent {

}

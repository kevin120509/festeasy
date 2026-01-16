import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './header.html'
})
export class HeaderComponent {
    auth = inject(AuthService);

    logout() {
        this.auth.logout();
        window.location.href = '/';
    }
}

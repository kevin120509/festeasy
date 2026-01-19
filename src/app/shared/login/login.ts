import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule, HeaderComponent],
    templateUrl: './login.html'
})
export class LoginComponent {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    error = '';
    loading = false;

    async login() {
        this.loading = true;
        try {
            const { user, session } = await this.supabaseAuth.signIn(this.email, this.password);
            if (user && session) {
                const role = user.user_metadata['rol'] || 'client';
                const profile = await this.supabaseAuth.getUserProfile(user.id, role as any);
                this.auth.login(session.access_token, { ...user, ...profile, rol: role });
                this.router.navigate([role === 'provider' ? '/proveedor/dashboard' : '/cliente/dashboard']);
            }
        } catch (err: any) {
            this.error = 'Credenciales inválidas';
        } finally {
            this.loading = false;
        }
    }
}
import { Component, inject, signal, AfterViewInit, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './login.html'
})
export class LoginComponent implements AfterViewInit {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private ngZone = inject(NgZone);

    email = '';
    password = '';
    error = '';
    loading = false;
    passwordVisible = signal(false);
    captchaResolved = signal(false);

    constructor() {
        // Expose callback for reCAPTCHA (global callback)
        (window as any).onCaptchaResolved = (token: string) => {
            this.ngZone.run(() => {
                this.captchaResolved.set(!!token);
            });
        };
    }

    ngAfterViewInit() {
        this.renderCaptcha();
    }

    renderCaptcha() {
        const checkGrecaptcha = () => {
            if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
                try {
                    (window as any).grecaptcha.render('recaptcha-login', {
                        'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
                        'callback': 'onCaptchaResolved'
                    });
                } catch (e) {
                    console.warn('reCAPTCHA already rendered or element missing', e);
                }
            } else {
                setTimeout(checkGrecaptcha, 500);
            }
        };
        checkGrecaptcha();
    }

    togglePasswordVisibility() {
        this.passwordVisible.update(v => !v);
    }

    async login() {
        this.loading = true;
        this.error = '';
        try {
            const { user, session } = await this.supabaseAuth.signIn(this.email.trim(), this.password);
            if (user && session) {
                // Determine role dynamically
                let rol = await this.supabaseAuth.determineUserRole(user.id);
                if (!rol) rol = user.user_metadata['rol'] || 'client';

                const profile = await this.supabaseAuth.getUserProfile(user.id, rol as any);

                this.auth.login(session.access_token, {
                    ...profile,
                    profile_id: (profile as any)?.id ?? null,
                    id: user.id,
                    email: user.email,
                    rol: rol,
                    nombre: user.user_metadata['nombre_negocio'] || user.user_metadata['nombre'] || 'Usuario',
                });

                console.log(`✅ Login exitoso como ${rol} - Redirigiendo...`);
                if (rol === 'admin') {
                    this.router.navigate(['/admin/dashboard']);
                } else if (rol === 'provider') {
                    this.router.navigate(['/proveedor/dashboard']);
                } else {
                    this.router.navigate(['/cliente/dashboard']);
                }
            }
        } catch (err: any) {
            console.error('❌ Error en login:', err);
            this.error = err.message || 'Credenciales inválidas';
        } finally {
            this.loading = false;
        }
    }

    async signInWithGoogle() {
        try {
            await this.auth.loginWithGoogle();
        } catch (error: any) {
            console.error('Error Google Login:', error);
            this.error = 'Error al iniciar con Google: ' + error.message;
        }
    }
}

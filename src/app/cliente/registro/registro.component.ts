import { Component, inject, signal, NgZone, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-cliente-registro',
    standalone: true,
    imports: [RouterLink, FormsModule, CheckboxModule],
    templateUrl: './registro.html'
})
export class ClienteRegistroComponent implements AfterViewInit {
    private supabaseAuth = inject(SupabaseAuthService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private ngZone = inject(NgZone);

    nombre = '';
    email = '';
    telefono = '';
    password = '';
    loading = signal(false);
    error = signal('');
    success = signal(false);
    captchaResolved = signal(false);
    aceptarTerminos = signal(false);
    aceptarPrivacidad = signal(false);

    constructor() {
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
                    (window as any).grecaptcha.render('recaptcha-cliente', {
                        'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
                        'callback': 'onCaptchaResolved'
                    });
                } catch (e) {
                    console.warn('reCAPTCHA Cliente already rendered or element missing', e);
                }
            } else {
                setTimeout(checkGrecaptcha, 500);
            }
        };
        checkGrecaptcha();
    }

    async register() {
        // 1. Sanitización estricta de datos
        const nombreClean = String(this.nombre || '').trim();
        const emailClean = String(this.email || '').trim().toLowerCase();
        const passwordClean = String(this.password || '').trim();
        const telefonoClean = String(this.telefono || '').trim();

        // 2. Validación local
        if (!nombreClean || !emailClean || !passwordClean) {
            this.error.set('Por favor completa todos los campos obligatorios');
            return;
        }

        if (passwordClean.length < 6) {
            this.error.set('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        this.loading.set(true);
        this.error.set('');

        try {
            console.log('Intentando registrar:', { email: emailClean, nombre: nombreClean }); // Debug

            // 3. Register User in Supabase Auth
            const { user, session } = await this.supabaseAuth.signUp(
                emailClean,
                passwordClean,
                {
                    nombre: nombreClean,
                    rol: 'client'
                }
            );

            if (!user) throw new Error('Error al crear usuario');

            // 2. Create Profile in DB
            await this.supabaseAuth.createClientProfile({
                usuario_id: user.id,
                nombre_completo: nombreClean,
                telefono: telefonoClean
            });

            // 3. Login
            if (session) {
                this.auth.login(session.access_token, {
                    id: user.id,
                    email: user.email!, // Email confirmado desde Supabase
                    rol: 'client',
                    nombre: nombreClean
                });
                this.router.navigate(['/cliente/dashboard']);
            } else {
                this.error.set('Registro exitoso. Por favor confirma tu correo.');
            }
            if (user) {
                this.success.set(true);
                this.error.set('');
            }

        } catch (err: any) {
            console.error('Registration error:', err);
            this.error.set(err.message || 'Error al registrar usuario');
        } finally {
            this.loading.set(false);
        }
    }
}

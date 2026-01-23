import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { ClientProfile } from '../../models';

@Component({
    selector: 'app-cliente-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configuracion.component.html'
})
export class ClienteConfiguracionComponent implements OnInit {
    private auth = inject(AuthService);
    private api = inject(ApiService);
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    profile = signal<ClientProfile | null>(null);
    loading = signal(false);
    saving = signal(false);
    uploadingAvatar = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

    formData = signal({
        nombre_completo: '',
        telefono: '',
        avatar_url: ''
    });

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.loading.set(true);
        const userId = this.auth.currentUser()?.id;

        if (!userId) {
            this.errorMessage.set('No se pudo obtener el usuario actual');
            this.loading.set(false);
            return;
        }

        this.api.getClientProfile(userId).subscribe({
            next: (profile) => {
                this.profile.set(profile);
                this.formData.set({
                    nombre_completo: profile.nombre_completo || '',
                    telefono: profile.telefono || '',
                    avatar_url: profile.avatar_url || ''
                });
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile', err);
                this.errorMessage.set('Error al cargar el perfil.');
                this.loading.set(false);
            }
        });
    }

    async onAvatarChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const userId = this.auth.currentUser()?.id;
        if (!userId) return;

        if (!file.type.startsWith('image/')) {
            this.errorMessage.set('Selecciona una imagen válida');
            return;
        }

        this.uploadingAvatar.set(true);
        try {
            const fileName = `client-avatars/${userId}-${Date.now()}`;
            const publicUrl = await this.supabase.uploadFile('festeasy', fileName, file);

            this.formData.update(data => ({ ...data, avatar_url: publicUrl }));
            this.successMessage.set('Imagen subida');
            setTimeout(() => this.successMessage.set(''), 3000);
        } catch (error) {
            console.error('Error uploading avatar', error);
            this.errorMessage.set('Error al subir imagen');
        } finally {
            this.uploadingAvatar.set(false);
        }
    }

    saveProfile() {
        if (!this.profile()) return;

        this.saving.set(true);
        this.successMessage.set('');
        this.errorMessage.set('');

        this.api.updateClientProfile(this.profile()!.id, this.formData()).subscribe({
            next: async (updated) => {
                this.profile.set(updated);
                await this.auth.refreshUserProfile();
                this.successMessage.set('Perfil actualizado exitosamente');
                this.saving.set(false);
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                console.error('Error updating profile', err);
                this.errorMessage.set('Error al guardar cambios');
                this.saving.set(false);
            }
        });
    }

    async cerrarSesion() {
        try {
            await this.auth.logout();
            this.router.navigate(['/login']);
        } catch (err) {
            console.error('Error cerrando sesión:', err);
        }
    }

    updateField(field: string, value: any) {
        this.formData.update(data => ({ ...data, [field]: value }));
    }
}

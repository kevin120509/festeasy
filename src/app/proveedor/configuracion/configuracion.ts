import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';
import { ProviderProfile } from '../../models';

@Component({
    selector: 'app-proveedor-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './configuracion.html',
    styleUrl: './configuracion.css'
})
export class ProveedorConfiguracionComponent implements OnInit {
    auth = inject(AuthService);
    api = inject(ApiService);
    supabase = inject(SupabaseService);

    profile = signal<ProviderProfile | null>(null);
    loading = signal(false);
    saving = signal(false);
    uploadingAvatar = signal(false);
    successMessage = signal('');
    errorMessage = signal('');

    // Form data
    formData = signal({
        nombre_negocio: '',
        descripcion: '',
        telefono: '',
        direccion_formato: '',
        radio_cobertura_km: 10,
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

        // Buscar el perfil del proveedor por usuario_id
        this.api.getProviderProfiles().subscribe({
            next: (profiles) => {
                const userProfile = profiles.find(p => p.usuario_id === userId);
                if (userProfile) {
                    this.profile.set(userProfile);
                    this.formData.set({
                        nombre_negocio: userProfile.nombre_negocio || '',
                        descripcion: userProfile.descripcion || '',
                        telefono: userProfile.telefono || '',
                        direccion_formato: userProfile.direccion_formato || '',
                        radio_cobertura_km: userProfile.radio_cobertura_km || 10,
                        avatar_url: userProfile.avatar_url || ''
                    });
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile', err);
                this.errorMessage.set('Error al cargar el perfil');
                this.loading.set(false);
            }
        });
    }

    async onAvatarChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            return;
        }

        const file = input.files[0];
        const userId = this.auth.currentUser()?.id;

        if (!userId) {
            this.errorMessage.set('No se pudo obtener el usuario actual');
            return;
        }

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            this.errorMessage.set('Por favor selecciona una imagen válida');
            return;
        }

        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.errorMessage.set('La imagen no debe superar los 2MB');
            return;
        }

        this.uploadingAvatar.set(true);
        this.errorMessage.set('');

        try {
            // Generar nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Subir archivo a Supabase Storage
            const publicUrl = await this.supabase.uploadFile('festeasy', filePath, file);

            // Actualizar el formData con la nueva URL
            this.formData.update(data => ({
                ...data,
                avatar_url: publicUrl
            }));

            this.successMessage.set('Imagen subida exitosamente');
            setTimeout(() => this.successMessage.set(''), 3000);
        } catch (error) {
            console.error('Error uploading avatar', error);
            this.errorMessage.set('Error al subir la imagen. Por favor intenta de nuevo.');
        } finally {
            this.uploadingAvatar.set(false);
        }
    }

    saveProfile() {
        const profileId = this.profile()?.id;
        if (!profileId) {
            this.errorMessage.set('No se encontró el perfil');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        this.api.updateProviderProfile(profileId, this.formData()).subscribe({
            next: (updatedProfile) => {
                this.profile.set(updatedProfile);
                this.successMessage.set('Perfil actualizado exitosamente');
                this.saving.set(false);
                setTimeout(() => this.successMessage.set(''), 3000);
            },
            error: (err) => {
                console.error('Error updating profile', err);
                this.errorMessage.set('Error al actualizar el perfil');
                this.saving.set(false);
            }
        });
    }

    updateField(field: string, value: any) {
        this.formData.update(data => ({
            ...data,
            [field]: value
        }));
    }
}

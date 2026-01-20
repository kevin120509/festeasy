import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';
import { ProviderProfile } from '../../models';

import { ProviderNavComponent } from '../shared/provider-nav/provider-nav.component';

@Component({
    selector: 'app-proveedor-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ProviderNavComponent],
    templateUrl: './configuracion.html',
    styleUrl: './configuracion.css'
})
export class ProveedorConfiguracionComponent implements OnInit {
    auth = inject(AuthService);
    api = inject(ApiService);
    supabase = inject(SupabaseService);
    router = inject(Router);

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

        // Buscar el perfil del proveedor por id o usuario_id
        this.api.getProviderProfile(userId).subscribe({
            next: (profile) => {
                this.profile.set(profile);
                this.formData.set({
                    nombre_negocio: profile.nombre_negocio || '',
                    descripcion: profile.descripcion || '',
                    telefono: profile.telefono || '',
                    direccion_formato: profile.direccion_formato || '',
                    radio_cobertura_km: profile.radio_cobertura_km || 10,
                    avatar_url: profile.avatar_url || ''
                });
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading profile', err);
                this.errorMessage.set('Perfil no encontrado. Contacte al administrador.');
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
        if (!this.profile()) {
            this.errorMessage.set('Perfil no encontrado. Contacte al administrador.');
            return;
        }

        const userId = this.auth.currentUser()?.id;
        if (!userId) {
            this.errorMessage.set('No se pudo obtener el usuario actual');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const data = { ...this.formData(), usuario_id: userId };
        this.api.updateProviderProfile(this.profile()!.id, data).subscribe({
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

    async logout() {
        try {
            await this.auth.logout();
            this.router.navigate(['/login']);
        } catch (error) {
            console.error('Error during logout:', error);
            this.errorMessage.set('Error al cerrar sesión');
        }
    }

    updateField(field: string, value: any) {
        this.formData.update(data => ({
            ...data,
            [field]: value
        }));
    }
}

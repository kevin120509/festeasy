import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    /**
     * Obtiene el cliente de Supabase para operaciones directas
     */
    getClient(): SupabaseClient {
        return this.supabase;
    }

    /**
     * Sube un archivo al bucket de Supabase Storage
     * @param bucket Nombre del bucket (ej: 'festeasy')
     * @param path Ruta dentro del bucket (ej: 'avatars/user-123.jpg')
     * @param file Archivo a subir
     * @returns Promise con la URL pública del archivo
     */
    async uploadFile(bucket: string, path: string, file: File): Promise<string> {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            throw error;
        }

        // Obtener URL pública
        const { data: publicUrlData } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrlData.publicUrl;
    }

    /**
     * Elimina un archivo del bucket de Supabase Storage
     * @param bucket Nombre del bucket
     * @param path Ruta del archivo a eliminar
     */
    async deleteFile(bucket: string, path: string): Promise<void> {
        const { error } = await this.supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            throw error;
        }
    }

    /**
     * Obtiene la URL pública de un archivo
     * @param bucket Nombre del bucket
     * @param path Ruta del archivo
     * @returns URL pública del archivo
     */
    getPublicUrl(bucket: string, path: string): string {
        const { data } = this.supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return data.publicUrl;
    }
}

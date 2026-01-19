import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Observable, from, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SupabaseDataService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    // ==========================================
    // Proveedores (Marketplace)
    // ==========================================
    getProviders(): Observable<any[]> {
        // En un escenario real, harías join con perfiles
        // Por ahora simulamos obteniendo perfiles de proveedor
        return from(this.supabase
            .from('perfil_proveedor')
            .select('*')
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data || [];
            })
        );
    }

    getProviderById(id: string): Observable<any> {
        return from(this.supabase
            .from('perfil_proveedor')
            .select('*')
            .eq('id', id)
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            })
        );
    }

    getProviderPackages(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('paquetes')
            .select('*')
            .eq('proveedor_id', providerId)
        ).pipe(
            map(({ data, error }) => {
                // Si la tabla no existe aún, retornamos vacío para no romper
                if (error && error.code === '42P01') {
                    return [];
                }
                if (error) throw error;
                return data || [];
            })
        );
    }

    getAllPackages(): Observable<any[]> {
        // Para el marketplace general, si quisiéramos mostrar paquetes destacados
        return from(this.supabase
            .from('paquetes')
            .select('*, perfil_proveedor(nombre_negocio)')
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    // ==========================================
    // Solicitudes (Eventos)
    // ==========================================
    getRequestsByClient(clientId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('*, perfil_proveedor(*)')
            .eq('cliente_id', clientId)
            .order('created_at', { ascending: false })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    getRequestsByProvider(providerId: string): Observable<any[]> {
        return from(this.supabase
            .from('solicitudes')
            .select('*, perfil_cliente(*)')
            .eq('proveedor_id', providerId)
            .order('created_at', { ascending: false })
        ).pipe(
            map(({ data, error }) => {
                if (error && error.code === '42P01') return [];
                if (error) throw error;
                return data || [];
            })
        );
    }

    async createRequest(requestData: any) {
        const { data, error } = await this.supabase
            .from('solicitudes')
            .insert([requestData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRequestStatus(id: string, status: string) {
        const { data, error } = await this.supabase
            .from('solicitudes')
            .update({ estado: status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ==========================================
    // Paquetes
    // ==========================================
    async createProviderPackage(packageData: any) {
        const { data, error } = await this.supabase
            .from('paquetes')
            .insert([packageData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getServiceCategories(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('categorias_servicio')
            .select('*');

        if (error) {
            if (error.code === '42P01') return []; // If table doesn't exist yet
            throw error;
        }
        return data || [];
    }
}

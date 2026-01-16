import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly API_URL = 'http://localhost:3000/api';

    private http = inject(HttpClient);
    private auth = inject(AuthService);

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        });
    }

    // Auth
    register(data: { correo_electronico: string; contrasena: string; rol: string; nombre?: string; nombre_negocio?: string }): Observable<any> {
        return this.http.post(`${this.API_URL}/auth/register`, data);
    }

    login(correo_electronico: string, contrasena: string): Observable<any> {
        return this.http.post(`${this.API_URL}/auth/login`, { correo_electronico, contrasena });
    }

    // Provider
    getProviderProfile(): Observable<any> {
        return this.http.get(`${this.API_URL}/provider/profile`, { headers: this.getHeaders() });
    }

    updateProviderProfile(data: any): Observable<any> {
        return this.http.put(`${this.API_URL}/provider/profile`, data, { headers: this.getHeaders() });
    }

    getProviderPackages(): Observable<any> {
        return this.http.get(`${this.API_URL}/provider/packages`, { headers: this.getHeaders() });
    }

    createPackage(data: any): Observable<any> {
        return this.http.post(`${this.API_URL}/provider/packages`, data, { headers: this.getHeaders() });
    }

    // Cart
    getCart(): Observable<any> {
        return this.http.get(`${this.API_URL}/cart`, { headers: this.getHeaders() });
    }

    addToCart(packageId: number, quantity: number): Observable<any> {
        return this.http.post(`${this.API_URL}/cart`, { packageId, quantity }, { headers: this.getHeaders() });
    }

    checkout(): Observable<any> {
        return this.http.post(`${this.API_URL}/checkout`, {}, { headers: this.getHeaders() });
    }

    // Requests
    getClientRequests(): Observable<any> {
        return this.http.get(`${this.API_URL}/requests/client`, { headers: this.getHeaders() });
    }

    getProviderRequests(): Observable<any> {
        return this.http.get(`${this.API_URL}/requests/provider`, { headers: this.getHeaders() });
    }

    updateRequestStatus(requestId: number, status: string): Observable<any> {
        return this.http.put(`${this.API_URL}/requests/${requestId}/status`, { status }, { headers: this.getHeaders() });
    }
}

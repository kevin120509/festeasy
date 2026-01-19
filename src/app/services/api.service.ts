import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import {
    User, ClientProfile, ProviderProfile, Cart, CartItem,
    ServiceRequest, Quote, Payment, ProviderPackage
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly API_URL = environment.apiUrl;

    private http = inject(HttpClient);
    private auth = inject(AuthService);

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        });
    }

    // ==========================================
    // 1. Autenticación (/users)
    // ==========================================
    register(data: { correo_electronico: string; contrasena: string; rol: string }): Observable<any> {
        return this.http.post(`${this.API_URL}/users/register`, data).pipe(
            tap(response => console.log('✅ Usuario registrado:', response)),
            catchError(error => {
                console.error('❌ Error en register():', {
                    status: error.status,
                    message: error.message,
                    body: error.error
                });
                return throwError(() => error);
            })
        );
    }

    login(correo_electronico: string, contrasena: string): Observable<any> {
        return this.http.post(`${this.API_URL}/users/login`, { correo_electronico, contrasena }).pipe(
            tap(response => console.log('✅ Login exitoso:', response)),
            catchError(error => {
                console.error('❌ Error en login():', {
                    status: error.status,
                    message: error.message,
                    body: error.error
                });
                if (error.status === 401) {
                    console.error('⚠️ Credenciales incorrectas o cuenta no activada');
                }
                return throwError(() => error);
            })
        );
    }

    getUser(id: string): Observable<User> {
        return this.http.get<User>(`${this.API_URL}/users/${id}`, { headers: this.getHeaders() });
    }

    updateUser(id: string, data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/users/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 1B. Autenticación Proveedores Independientes
    // ==========================================
    registerProvider(data: {
        correo_electronico: string;
        contrasena: string;
        nombre_negocio: string;
        descripcion?: string;
        telefono?: string;
        direccion_formato?: string;
        categoria_principal_id?: string;
    }): Observable<any> {
        return this.http.post(`${this.API_URL}/perfil-proveedor/register`, data).pipe(
            tap(response => console.log('✅ Proveedor registrado:', response)),
            catchError(error => {
                console.error('❌ Error en registerProvider():', {
                    status: error.status,
                    message: error.message,
                    body: error.error,
                    url: error.url
                });
                return throwError(() => error);
            })
        );
    }

    loginProvider(correo_electronico: string, contrasena: string): Observable<any> {
        return this.http.post(`${this.API_URL}/perfil-proveedor/login`, { correo_electronico, contrasena }).pipe(
            tap(response => console.log('✅ Login proveedor exitoso:', response)),
            catchError(error => {
                console.error('❌ Error en loginProvider():', {
                    status: error.status,
                    message: error.message,
                    body: error.error
                });
                if (error.status === 401) {
                    console.error('⚠️ Credenciales incorrectas o cuenta no activada');
                }
                return throwError(() => error);
            })
        );
    }

    // ==========================================
    // 2. Perfil Cliente (/perfil-cliente)
    // ==========================================
    createClientProfile(data: Partial<ClientProfile>): Observable<ClientProfile> {
        return this.http.post<ClientProfile>(`${this.API_URL}/perfil-cliente`, data, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('✅ Perfil cliente creado:', response)),
            catchError(error => {
                console.error('❌ Error en createClientProfile():', {
                    status: error.status,
                    message: error.message,
                    body: error.error
                });
                return throwError(() => error);
            })
        );
    }

    getClientProfiles(): Observable<ClientProfile[]> {
        return this.http.get<ClientProfile[]>(`${this.API_URL}/perfil-cliente`, { headers: this.getHeaders() });
    }

    getClientProfile(id: string): Observable<ClientProfile> {
        return this.http.get<ClientProfile>(`${this.API_URL}/perfil-cliente/${id}`, { headers: this.getHeaders() });
    }

    updateClientProfile(id: string, data: Partial<ClientProfile>): Observable<ClientProfile> {
        return this.http.put<ClientProfile>(`${this.API_URL}/perfil-cliente/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 3. Perfil Proveedor (/perfil-proveedor)
    // ==========================================
    createProviderProfile(data: Partial<ProviderProfile>): Observable<ProviderProfile> {
        console.log('📤 Creando perfil proveedor con datos:', data);
        return this.http.post<ProviderProfile>(`${this.API_URL}/perfil-proveedor`, data, { headers: this.getHeaders() }).pipe(
            tap(response => console.log('✅ Perfil proveedor creado:', response)),
            catchError(error => {
                console.error('❌ Error en createProviderProfile():', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    body: error.error,
                    url: error.url
                });
                return throwError(() => error);
            })
        );
    }

    getProviderProfiles(): Observable<ProviderProfile[]> {
        return this.http.get<ProviderProfile[]>(`${this.API_URL}/perfil-proveedor`, { headers: this.getHeaders() });
    }

    getProviderProfile(id: string): Observable<ProviderProfile> {
        return this.http.get<ProviderProfile>(`${this.API_URL}/perfil-proveedor/${id}`, { headers: this.getHeaders() });
    }

    updateProviderProfile(id: string, data: Partial<ProviderProfile>): Observable<ProviderProfile> {
        return this.http.put<ProviderProfile>(`${this.API_URL}/perfil-proveedor/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 4. Carrito (/carrito)
    // ==========================================
    updateCart(id: string, data: Partial<Cart>): Observable<Cart> {
        return this.http.put<Cart>(`${this.API_URL}/carrito/${id}`, data, { headers: this.getHeaders() });
    }

    getCart(): Observable<Cart> {
        return this.http.get<Cart>(`${this.API_URL}/carrito`, { headers: this.getHeaders() });
    }

    // ==========================================
    // 5. Items Carrito (/items-carrito)
    // ==========================================
    addItemToCart(data: Partial<CartItem>): Observable<CartItem> {
        return this.http.post<CartItem>(`${this.API_URL}/items-carrito`, data, { headers: this.getHeaders() });
    }

    getCartItems(): Observable<CartItem[]> {
        return this.http.get<CartItem[]>(`${this.API_URL}/items-carrito`, { headers: this.getHeaders() });
    }

    deleteCartItem(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/items-carrito/${id}`, { headers: this.getHeaders() });
    }

    // ==========================================
    // 6. Solicitudes (/solicitudes)
    // ==========================================
    createRequest(data: Partial<ServiceRequest>): Observable<ServiceRequest> {
        return this.http.post<ServiceRequest>(`${this.API_URL}/solicitudes`, data, { headers: this.getHeaders() });
    }

    getClientRequests(): Observable<ServiceRequest[]> {
        return this.http.get<ServiceRequest[]>(`${this.API_URL}/solicitudes/client`, { headers: this.getHeaders() });
    }

    getProviderRequests(): Observable<ServiceRequest[]> {
        return this.http.get<ServiceRequest[]>(`${this.API_URL}/solicitudes/provider`, { headers: this.getHeaders() });
    }

    updateRequestStatus(id: string, status: string): Observable<ServiceRequest> {
        return this.http.put<ServiceRequest>(`${this.API_URL}/solicitudes/${id}/status`, { status }, { headers: this.getHeaders() });
    }

    getRequests(): Observable<ServiceRequest[]> {
        return this.http.get<ServiceRequest[]>(`${this.API_URL}/solicitudes`, { headers: this.getHeaders() });
    }

    getRequest(id: string): Observable<ServiceRequest> {
        return this.http.get<ServiceRequest>(`${this.API_URL}/solicitudes/${id}`, { headers: this.getHeaders() });
    }

    updateRequest(id: string, data: Partial<ServiceRequest>): Observable<ServiceRequest> {
        return this.http.put<ServiceRequest>(`${this.API_URL}/solicitudes/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 7. Cotizaciones (/cotizaciones)
    // ==========================================
    createQuote(data: Partial<Quote>): Observable<Quote> {
        return this.http.post<Quote>(`${this.API_URL}/cotizaciones`, data, { headers: this.getHeaders() });
    }

    getQuotes(): Observable<Quote[]> {
        return this.http.get<Quote[]>(`${this.API_URL}/cotizaciones`, { headers: this.getHeaders() });
    }

    updateQuote(id: string, data: Partial<Quote>): Observable<Quote> {
        return this.http.put<Quote>(`${this.API_URL}/cotizaciones/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 8. Pagos (/pagos)
    // ==========================================
    createPayment(data: Partial<Payment>): Observable<Payment> {
        return this.http.post<Payment>(`${this.API_URL}/pagos`, data, { headers: this.getHeaders() });
    }

    getPayments(): Observable<Payment[]> {
        return this.http.get<Payment[]>(`${this.API_URL}/pagos`, { headers: this.getHeaders() });
    }

    updatePayment(id: string, data: Partial<Payment>): Observable<Payment> {
        return this.http.put<Payment>(`${this.API_URL}/pagos/${id}`, data, { headers: this.getHeaders() });
    }

    // ==========================================
    // 9. Paquetes Proveedor (/paquetes-proveedor)
    // ==========================================
    createProviderPackage(data: Partial<ProviderPackage>): Observable<ProviderPackage> {
        return this.http.post<ProviderPackage>(`${this.API_URL}/paquetes-proveedor`, data, { headers: this.getHeaders() });
    }

    getProviderPackages(): Observable<ProviderPackage[]> {
        return this.http.get<ProviderPackage[]>(`${this.API_URL}/paquetes-proveedor`, { headers: this.getHeaders() });
    }

    getProviderPackage(id: string): Observable<ProviderPackage> {
        return this.http.get<ProviderPackage>(`${this.API_URL}/paquetes-proveedor/${id}`);
    }

    updateProviderPackage(id: string, data: Partial<ProviderPackage>): Observable<ProviderPackage> {
        return this.http.put<ProviderPackage>(`${this.API_URL}/paquetes-proveedor/${id}`, data, { headers: this.getHeaders() });
    }

    deleteProviderPackage(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/paquetes-proveedor/${id}`, { headers: this.getHeaders() });
    }

    // ==========================================
    // 10. Reseñas (/resenas)
    // ==========================================
    getReviews(proveedorId?: string): Observable<any[]> {
        let params = new HttpParams();
        if (proveedorId) {
            params = params.append('proveedor_id', proveedorId);
        }
        return this.http.get<any[]>(`${this.API_URL}/resenas`, { headers: this.getHeaders(), params });
    }

    // ==========================================
    // 11. Bloqueo Calendario (/bloqueos-calendario)
    // ==========================================
    getCalendarBlocks(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/bloqueos-calendario`, { headers: this.getHeaders() });
    }

    createCalendarBlock(data: { fecha: string; motivo?: string }): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/bloqueos-calendario`, data, { headers: this.getHeaders() });
    }

    deleteCalendarBlock(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/bloqueos-calendario/${id}`, { headers: this.getHeaders() });
    }

    // ==========================================
    // 12. Dashboard Proveedor
    // ==========================================
    getProviderDashboardMetrics(): Observable<any> {
        // Retorna KPIs: solicitudes nuevas, cotizaciones activas, ingresos mensuales
        return this.http.get<any>(`${this.API_URL}/dashboard/proveedor/metrics`, { headers: this.getHeaders() });
    }

    getRecentRequests(): Observable<ServiceRequest[]> {
        return this.http.get<ServiceRequest[]>(`${this.API_URL}/dashboard/proveedor/recent-requests`, { headers: this.getHeaders() });
    }

    getRecentPayments(): Observable<Payment[]> {
        return this.http.get<Payment[]>(`${this.API_URL}/dashboard/proveedor/recent-payments`, { headers: this.getHeaders() });
    }

    // ==========================================
    // 13. Categorías (/categorias-servicio)
    // ==========================================
    getServiceCategories(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/categorias-servicio`);
    }
}


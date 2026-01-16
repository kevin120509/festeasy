import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GeocodingResult {
    lat: number;
    lng: number;
    formatted_address: string;
}

export interface ServiceRequest {
    id: number;
    titulo_evento: string;
    fecha_servicio: string;
    latitud_servicio: number;
    longitud_servicio: number;
    distancia: number;
}

@Injectable({
    providedIn: 'root'
})
export class GeoService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/api/geo';

    geocode(address: string): Observable<GeocodingResult> {
        return this.http.post<GeocodingResult>(`${this.apiUrl}/geocode`, { address });
    }

    searchNearby(lat: number, lng: number, radiusKm: number = 20): Observable<ServiceRequest[]> {
        const params = new HttpParams()
            .set('lat', lat.toString())
            .set('lng', lng.toString())
            .set('radius', radiusKm.toString());

        return this.http.get<ServiceRequest[]>(`${this.apiUrl}/search`, { params });
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface GeocodingResult {
    lat: number;
    lng: number;
    formatted_address: string;
}

export interface LocationInfo {
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
    formatted_address?: string;
}

@Injectable({
    providedIn: 'root'
})
export class GeoService {
    private http = inject(HttpClient);

    /**
     * Obtiene la ubicación actual del usuario usando el GPS del navegador
     */
    getCurrentPosition(): Observable<GeolocationPosition> {
        return new Observable(observer => {
            if (!navigator.geolocation) {
                observer.error('Geolocalización no soportada en este navegador');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    observer.next(position);
                    observer.complete();
                },
                (error) => {
                    let errorMsg = 'Error al obtener ubicación';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = 'Permiso de ubicación denegado. Por favor habilítalo en tu navegador.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = 'Información de ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            errorMsg = 'Tiempo de espera agotado al obtener ubicación';
                            break;
                    }
                    observer.error(errorMsg);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // Cache por 5 minutos
                }
            );
        });
    }

    /**
     * Obtiene las coordenadas actuales como un objeto simple
     */
    getCurrentCoordinates(): Observable<{ lat: number; lng: number }> {
        return this.getCurrentPosition().pipe(
            map(position => ({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }))
        );
    }

    /**
     * Obtiene la ubicación completa con dirección usando Nominatim (OpenStreetMap - GRATIS)
     */
    getCurrentLocation(): Observable<LocationInfo> {
        return new Observable(observer => {
            this.getCurrentPosition().subscribe({
                next: (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    // Usar Nominatim para geocodificación inversa (gratis, no requiere API key)
                    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`;

                    this.http.get<any>(url).subscribe({
                        next: (data) => {
                            const location: LocationInfo = {
                                lat,
                                lng,
                                city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality,
                                state: data.address?.state,
                                country: data.address?.country,
                                formatted_address: data.display_name
                            };
                            observer.next(location);
                            observer.complete();
                        },
                        error: () => {
                            // Si falla el geocoding, al menos devolvemos las coordenadas
                            observer.next({ lat, lng });
                            observer.complete();
                        }
                    });
                },
                error: (err) => observer.error(err)
            });
        });
    }

    /**
     * Convierte una dirección en coordenadas (geocodificación)
     */
    geocodeAddress(address: string): Observable<LocationInfo | null> {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=es`;

        return this.http.get<any[]>(url).pipe(
            map(results => {
                if (results && results.length > 0) {
                    const result = results[0];
                    return {
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon),
                        formatted_address: result.display_name
                    };
                }
                return null;
            }),
            catchError(() => of(null))
        );
    }

    /**
     * Calcula la distancia entre dos puntos (en km)
     */
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

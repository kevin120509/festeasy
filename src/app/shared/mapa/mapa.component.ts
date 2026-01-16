import { Component, AfterViewInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { GeoService, LocationInfo } from '../../services/geo.service';

// Fix for default marker icons validation
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
    selector: 'app-mapa',
    standalone: true,
    imports: [FormsModule],
    template: `
    <div class="map-container">
      <div class="controls">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchAddress" 
            placeholder="Ingrese una dirección..." 
            (keyup.enter)="geocodeAddress()"
          />
          <button (click)="geocodeAddress()">Buscar</button>
        </div>
        
        <div class="filters">
          <label>Radio (km): {{ radius }}</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            [(ngModel)]="radius" 
            (change)="updateRadius()"
          />
        </div>
      </div>

      <div id="map"></div>
    </div>
  `,
    styles: [`
    .map-container {
      position: relative;
      height: 500px;
      width: 100%;
      border-radius: var(--border-radius);
      overflow: hidden;
    }
    #map {
      height: 100%;
      width: 100%;
      z-index: 1;
    }
    .controls {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 1000;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 300px;
    }
    .search-box {
      display: flex;
      gap: 8px;
    }
    input[type="text"] {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    .filters {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  `]
})
export class MapaComponent implements AfterViewInit {
    private map!: L.Map;
    private currentMarker: L.Marker | null = null;
    private radiusCircle: L.Circle | null = null;

    searchAddress = '';
    radius = 20;

    currentLat = 19.4326; // CDMX default
    currentLng = -99.1332;

    geoService = inject(GeoService);

    ngAfterViewInit() {
        this.initMap();
    }

    private initMap(): void {
        this.map = L.map('map').setView([this.currentLat, this.currentLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    geocodeAddress() {
        if (!this.searchAddress) return;

        this.geoService.geocodeAddress(this.searchAddress).subscribe({
            next: (result) => {
                if (result) {
                    this.updateMapLocation(result.lat, result.lng);
                    if (result.formatted_address) {
                        this.searchAddress = result.formatted_address;
                    }
                    // this.searchNearbyProviders(result.lat, result.lng);
                }
            },
            error: (err: any) => console.error('Geocoding error', err)
        });
    }

    updateMapLocation(lat: number, lng: number) {
        this.currentLat = lat;
        this.currentLng = lng;

        this.map.setView([lat, lng], 13);

        if (this.currentMarker) this.map.removeLayer(this.currentMarker);
        if (this.radiusCircle) this.map.removeLayer(this.radiusCircle);

        this.currentMarker = L.marker([lat, lng]).addTo(this.map)
            .bindPopup('Ubicación seleccionada').openPopup();

        this.updateRadius();
    }

    updateRadius() {
        if (this.radiusCircle) this.map.removeLayer(this.radiusCircle);

        this.radiusCircle = L.circle([this.currentLat, this.currentLng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.1,
            radius: this.radius * 1000 // meters
        }).addTo(this.map);

        // Refresh search if location is set
        // TODO: Implement nearby provider search
        // this.searchNearbyProviders(this.currentLat, this.currentLng);
    }
}

import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-espera-solicitud',
  standalone: true,
  templateUrl: './espera-solicitud.component.html',
  styleUrls: ['./espera-solicitud.component.css']
})
export class EsperaSolicitudComponent implements OnInit {
  router = inject(Router);
  proveedor: any = null;
  solicitud: any = null;
  tiempoRestante: number = 24 * 60 * 60; // 24 horas en segundos
  intervalId: any;

  ngOnInit() {
    // Recuperar datos de navegación o localStorage
    const nav = history.state;
    this.proveedor = nav.proveedor || JSON.parse(localStorage.getItem('solicitud_proveedor') || '{}');
    this.solicitud = nav.solicitud || JSON.parse(localStorage.getItem('solicitud_evento') || '{}');
    this.iniciarContador();
  }

  iniciarContador() {
    this.intervalId = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      }
    }, 1000);
  }

  get tiempoFormateado() {
    const h = Math.floor(this.tiempoRestante / 3600);
    const m = Math.floor((this.tiempoRestante % 3600) / 60);
    const s = this.tiempoRestante % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

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
  tiempoRestante: number = 24 * 60 * 60;
  windowHours: number = 24;
  intervalId: any;

  ngOnInit() {
    const nav = history.state;
    this.proveedor = nav.proveedor || JSON.parse(localStorage.getItem('solicitud_proveedor') || '{}');
    this.solicitud = nav.solicitud || JSON.parse(localStorage.getItem('solicitud_evento') || '{}');

    this.calcularDeadlineDinamico();
    this.iniciarContador();
  }

  private calcularDeadlineDinamico() {
    if (!this.solicitud?.fecha) {
      this.tiempoRestante = 24 * 3600;
      this.windowHours = 24;
      return;
    }

    // Calcular horas hasta el evento
    const ahora = new Date();
    const fechaEvento = new Date(`${this.solicitud.fecha}T${this.solicitud.hora || '00:00'}`);
    const msHastaEvento = fechaEvento.getTime() - ahora.getTime();
    const horasHastaEvento = msHastaEvento / (1000 * 3600);

    if (horasHastaEvento > 24) {
      this.windowHours = 24;
    } else if (horasHastaEvento > 12) {
      this.windowHours = 6;
    } else {
      this.windowHours = 3;
    }

    this.tiempoRestante = this.windowHours * 3600;
  }

  iniciarContador() {
    this.intervalId = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
      }
    }, 1000);
  }

  get windowHoursText() {
    return `${this.windowHours} horas`;
  }

  get tiempoFormateado() {
    const h = Math.floor(this.tiempoRestante / 3600);
    const m = Math.floor((this.tiempoRestante % 3600) / 60);
    const s = this.tiempoRestante % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

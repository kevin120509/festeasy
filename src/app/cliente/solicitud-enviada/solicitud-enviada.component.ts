import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-solicitud-enviada',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './solicitud-enviada.component.html'
})
export class SolicitudEnviadaComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private timerInterval: any;

    // Datos de la solicitud enviada
    solicitudData = signal<any>(null);
    
    // Contador de 24 horas
    horasRestantes = signal(24);
    minutosRestantes = signal(0);
    segundosRestantes = signal(0);
    
    // Estado
    tiempoAgotado = signal(false);

    ngOnInit(): void {
        // Cargar datos de la solicitud desde sessionStorage
        const solicitudGuardada = sessionStorage.getItem('solicitudEnviada');
        if (solicitudGuardada) {
            const data = JSON.parse(solicitudGuardada);
            this.solicitudData.set(data);
            
            // Calcular tiempo restante desde el momento del envío
            const fechaEnvio = new Date(data.fechaEnvio);
            const fechaExpiracion = new Date(fechaEnvio.getTime() + 24 * 60 * 60 * 1000); // +24 horas
            this.iniciarContador(fechaExpiracion);
        } else {
            // Si no hay datos, redirigir a solicitudes
            this.router.navigate(['/cliente/solicitudes']);
        }
    }

    ngOnDestroy(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    iniciarContador(fechaExpiracion: Date) {
        this.actualizarTiempo(fechaExpiracion);
        
        this.timerInterval = setInterval(() => {
            this.actualizarTiempo(fechaExpiracion);
        }, 1000);
    }

    actualizarTiempo(fechaExpiracion: Date) {
        const ahora = new Date();
        const diferencia = fechaExpiracion.getTime() - ahora.getTime();
        
        if (diferencia <= 0) {
            this.tiempoAgotado.set(true);
            this.horasRestantes.set(0);
            this.minutosRestantes.set(0);
            this.segundosRestantes.set(0);
            clearInterval(this.timerInterval);
            return;
        }

        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        this.horasRestantes.set(horas);
        this.minutosRestantes.set(minutos);
        this.segundosRestantes.set(segundos);
    }

    verMisSolicitudes() {
        // Limpiar datos temporales
        sessionStorage.removeItem('solicitudEnviada');
        sessionStorage.removeItem('eventoActual');
        this.router.navigate(['/cliente/solicitudes']);
    }

    crearOtroEvento() {
        sessionStorage.removeItem('solicitudEnviada');
        sessionStorage.removeItem('eventoActual');
        this.router.navigate(['/cliente/solicitudes/crear']);
    }
}

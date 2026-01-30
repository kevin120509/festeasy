import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Subscription } from 'rxjs';
// 1. Importaciones necesarias para el modal
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// IMPORTANTE: Ruta corregida al componente del modal
import { RatingModalComponent } from './rating-modal/rating-modal.component';
@Component({
  selector: 'app-realtime-listener-example',
  standalone: true,
  // 2. Agregamos MatDialogModule a los imports del componente
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold mb-4 text-slate-800">Panel de Control: FestEasy Realtime</h2>
      
      @if (listenerActivo()) {
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="animate-pulse w-3 h-3 bg-emerald-500 rounded-full"></span>
            <p class="text-emerald-800 font-medium">Escuchando señales de Supabase en vivo...</p>
          </div>
        </div>
      }

      @if (ultimaSolicitudFinalizada()) {
        <div class="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-6 rounded-r-lg shadow-md">
          <h3 class="text-indigo-900 font-bold text-lg mb-2">¡Servicio Finalizado Detectado!</h3>
          <div class="space-y-1 text-sm text-indigo-800">
            <p><strong>ID Solicitud:</strong> {{ ultimaSolicitudFinalizada()?.solicitud_id }}</p>
            <p><strong>ID Proveedor:</strong> {{ ultimaSolicitudFinalizada()?.destinatario_id }}</p>
          </div>
          <p class="text-xs text-indigo-400 mt-4 italic">El modal de calificación se ha activado automáticamente.</p>
        </div>
      }

      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="text-xl">📋</span> Historial de Eventos
        </h3>
        @if (historialEventos().length === 0) {
          <p class="text-slate-400 text-sm italic">No hay actividad reciente...</p>
        } @else {
          <div class="space-y-2">
            @for (evento of historialEventos(); track evento.timestamp) {
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                <span class="text-sm font-medium text-slate-600">ID: {{ evento.solicitud_id.substring(0, 8) }}...</span>
                <span class="text-xs text-slate-400">{{ evento.timestamp | date:'shortTime' }}</span>
              </div>
            }
          </div>
        }
      </div>

      <div class="mt-8 flex items-center gap-4">
        <button 
          (click)="toggleListener()"
          [class]="listenerActivo() ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'"
          class="text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg active:scale-95">
          {{ listenerActivo() ? 'Detener Monitoreo' : 'Iniciar Monitoreo' }}
        </button>
        
        <button (click)="limpiarHistorial()" class="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
          Limpiar registros
        </button>
      </div>
    </div>
  `
})
export class RealtimeListenerExampleComponent implements OnInit, OnDestroy {
  // 3. Inyectamos las dependencias usando la sintaxis moderna
  private apiService = inject(ApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog); // <--- Esto resuelve el error de inyección
  private subscription?: Subscription;

  listenerActivo = signal(false);
  ultimaSolicitudFinalizada = signal<{
    solicitud_id: string;
    destinatario_id: string;
    autor_id: string;
    timestamp: Date;
  } | null>(null);

  historialEventos = signal<Array<{
    solicitud_id: string;
    destinatario_id: string;
    autor_id: string;
    timestamp: Date;
  }>>([]);

  ngOnInit(): void {
    this.iniciarListener();
  }

  ngOnDestroy(): void {
    console.log('🔕 Componente destruyéndose, deteniendo listener...');
    this.detenerListener();
  }

  private iniciarListener(): void {
    console.log('🔔 FestEasy: Activando radar de servicios...');

    this.subscription = this.apiService.listenToSolicitudFinalizada().subscribe({
      next: ({ solicitud_id, destinatario_id, autor_id }: { solicitud_id: string; destinatario_id: string; autor_id: string }) => {
        console.log('🎯 Evento recibido en componente de ejemplo:', {
          solicitud_id,
          destinatario_id,
          autor_id
        });

        const evento = {
          solicitud_id,
          destinatario_id,
          autor_id,
          timestamp: new Date()
        };

        this.ultimaSolicitudFinalizada.set(evento);
        this.historialEventos.update(h => [evento, ...h]);

        // --- ACCIÓN AUTOMÁTICA ---
        console.log('🎭 Abriendo modal de reseña automáticamente...');
        this.abrirModalDeResena(solicitud_id, destinatario_id);
      },
      error: (err: any) => {
        console.error('❌ Error Realtime en componente:', err);
        // ⚠️ NO detenemos el listener aquí
      }
    });

    this.listenerActivo.set(true);
    console.log('✅ Listener activado en componente de ejemplo');
  }

  // 4. Función para disparar el modal automáticamente
  private abrirModalDeResena(solicitudId: string, proveedorId: string): void {
    this.dialog.open(RatingModalComponent, {
      width: '400px',
      data: {
        solicitud_id: solicitudId,
        destinatario_id: proveedorId
      },
      disableClose: true // Obliga al usuario a interactuar con el modal
    });
  }

  private detenerListener(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
    this.apiService.stopListeningToSolicitudes();
    this.listenerActivo.set(false);
  }

  toggleListener(): void {
    this.listenerActivo() ? this.detenerListener() : this.iniciarListener();
  }

  limpiarHistorial(): void {
    this.historialEventos.set([]);
    this.ultimaSolicitudFinalizada.set(null);
  }
}
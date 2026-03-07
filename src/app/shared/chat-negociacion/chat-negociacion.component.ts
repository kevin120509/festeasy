import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MensajeChat {
  id: string;
  solicitud_id: string;
  emisor_usuario_id: string;
  mensaje: string;
  leido: boolean;
  creado_en: string;
}

@Component({
  selector: 'app-chat-negociacion',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat-negociacion.component.html'
})
export class ChatNegociacionComponent implements OnInit, OnDestroy {
  @Input() solicitudId!: string;
  @Input() tituloEvento!: string;
  @Input() estadoSolicitud!: string;
  @Input() receptorNombre: string = 'Usuario';
  @Input() receptorAvatar?: string;
  @Input() esProveedor: boolean = false;

  @Output() mensajeEnviado = new EventEmitter<void>();

  private api = inject(ApiService);
  public auth = inject(AuthService);
  
  @ViewChild('scrollContainer', { static: false }) private scrollContainer?: ElementRef;

  mensajes = signal<MensajeChat[]>([]);
  nuevoMensaje = signal('');
  procesando = signal(false);
  cargandoMensajes = signal(true);
  
  isOpen = signal<boolean>(false);
  unreadCount = signal<number>(0);

  userId = signal<string>('');
  private realtimeChannel: RealtimeChannel | null = null;
  private sound = new Audio('assets/sounds/message.mp3'); // Optional sound

  constructor() {
    effect(() => {
      // Auto-scroll when messages update
      const msgs = this.mensajes();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  async ngOnInit() {
    const user = await this.api.debugCurrentUser();
    if (user) {
      this.userId.set(user.id);
    }
    
    if (this.solicitudId) {
      this.cargarMensajes();
      this.iniciarSuscripcionRealtime();
    }

    this.requestNotificationPermission();
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.api.desuscribirseDeChat(this.realtimeChannel);
    }
  }

  cargarMensajes() {
    this.cargandoMensajes.set(true);
    this.api.getMensajesChat(this.solicitudId).subscribe({
      next: (data: any) => {
        this.mensajes.set(data as MensajeChat[]);
        this.cargandoMensajes.set(false);
        this.marcarComoLeidos();
      },
      error: (err: any) => {
        console.error('Error cargando mensajes:', err);
        this.cargandoMensajes.set(false);
      }
    });
  }

  iniciarSuscripcionRealtime() {
    this.realtimeChannel = this.api.suscribirseAChat(this.solicitudId, (nuevoMsg: any) => {
      // Agregar al array local asegurando no haber duplicados
      const actuales = this.mensajes();
      if (!actuales.find(m => m.id === nuevoMsg.id)) {
        this.mensajes.set([...actuales, nuevoMsg as MensajeChat]);
      }
      
      // Si el mensaje NO es mío, marcar como leído y sonar/notificar
      if (nuevoMsg.emisor_usuario_id !== this.userId()) {
        if (this.isOpen()) {
            this.marcarComoLeidos();
        } else {
            this.unreadCount.update(c => c + 1);
            this.showDesktopNotification(nuevoMsg.mensaje);
        }
        this.playNotificationSound();
      }
    });
  }

  showDesktopNotification(msg: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nuevo mensaje de ${this.receptorNombre}`, {
        body: msg,
        icon: this.receptorAvatar || '/favicon.ico'
      });
    }
  }

  enviarMensaje() {
    const texto = this.nuevoMensaje().trim();
    if (!texto || this.procesando()) return;

    this.procesando.set(true);
    
    // Si estado = pendiente_aprobacion, puede que queramos cambiarlo a en_negociacion la primera vez que chatean
    // Esto se maneja mejor en el componente padre disparando un evento, pero lo podemos hacer aquí si es genérico
    
    this.api.enviarMensajeChat(this.solicitudId, texto).subscribe({
      next: (creado: any) => {
        this.nuevoMensaje.set('');
        this.procesando.set(false);
        this.mensajeEnviado.emit();
        
        // Agregar manualmente para evitar retrasos si Realtime falla
        if (creado) {
          const actuales = this.mensajes();
          // Asegurar no duplicados si Realtime entra muy rápido
          if (!actuales.find(m => m.id === creado.id)) {
            this.mensajes.set([...actuales, creado as MensajeChat]);
          }
        }
      },
      error: (err: any) => {
        console.error('Error enviando mensaje:', err);
        this.procesando.set(false);
      }
    });
  }

  marcarComoLeidos() {
    this.api.marcarMensajesComoLeidos(this.solicitudId).subscribe({
      next: () => console.log('✅ Mensajes marcados como leídos')
    });
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.unreadCount.set(0);
      this.marcarComoLeidos();
      setTimeout(() => this.scrollToBottom(), 150);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  private playNotificationSound() {
    // try { this.sound.play().catch(() => {}); } catch(e) {}
  }
}

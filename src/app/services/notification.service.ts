import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, catchError, of, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Notification {
    id: string;
    usuario_id: string;
    tipo: 'solicitud' | 'pago' | 'recordatorio' | 'review' | 'cancelacion';
    titulo: string;
    mensaje: string;
    leida: boolean;
    data?: any;
    creado_en: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private supabase: SupabaseClient;
    private auth = inject(AuthService);

    notifications = signal<Notification[]>([]);
    unreadCount = signal<number>(0);

    constructor() {
        this.supabase = inject(SupabaseService).getClient();
    }

    getNotifications(): Observable<Notification[]> {
        const userId = this.auth.getUserId();
        if (!userId) return of([]);

        return from(this.supabase
            .from('notificaciones')
            .select('*')
            .eq('usuario_id', userId)
            .order('creado_en', { ascending: false })
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                const items = (data || []) as Notification[];
                this.notifications.set(items);
                this.unreadCount.set(items.filter(n => !n.leida).length);
                return items;
            }),
            catchError(error => {
                console.error('Error fetching notifications:', error);
                return of([]);
            })
        );
    }

    createNotification(notification: Partial<Notification>): Observable<Notification | null> {
        return from(this.supabase
            .from('notificaciones')
            .insert(notification)
            .select()
            .single()
        ).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data as Notification;
            }),
            tap(newNotif => {
                if (newNotif) {
                    this.notifications.update(prev => [newNotif, ...prev]);
                    if (!newNotif.leida) {
                        this.unreadCount.update(c => c + 1);
                    }
                    // Simulate email sending
                    this.sendEmailSimulation(newNotif);
                }
            }),
            catchError(error => {
                console.error('Error creating notification:', error);
                return of(null);
            })
        );
    }

    markAsRead(id: string): Observable<boolean> {
        return from(this.supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id)
        ).pipe(
            map(({ error }) => {
                if (error) throw error;
                this.notifications.update(prev =>
                    prev.map(n => n.id === id ? { ...n, leida: true } : n)
                );
                this.unreadCount.update(c => Math.max(0, c - 1));
                return true;
            }),
            catchError(error => {
                console.error('Error marking notification as read:', error);
                return of(false);
            })
        );
    }

    markAllAsRead(): Observable<boolean> {
        const userId = this.auth.getUserId();
        if (!userId) return of(false);

        return from(this.supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('usuario_id', userId)
            .eq('leida', false)
        ).pipe(
            map(({ error }) => {
                if (error) throw error;
                this.notifications.update(prev =>
                    prev.map(n => ({ ...n, leida: true }))
                );
                this.unreadCount.set(0);
                return true;
            }),
            catchError(error => {
                console.error('Error marking all notifications as read:', error);
                return of(false);
            })
        );
    }

    markAsUnread(id: string): Observable<boolean> {
        return from(this.supabase
            .from('notificaciones')
            .update({ leida: false })
            .eq('id', id)
        ).pipe(
            map(({ error }) => {
                if (error) throw error;
                this.notifications.update(prev =>
                    prev.map(n => n.id === id ? { ...n, leida: false } : n)
                );
                this.unreadCount.update(c => c + 1);
                return true;
            }),
            catchError(error => {
                console.error('Error marking notification as unread:', error);
                return of(false);
            })
        );
    }

    deleteNotification(id: string): Observable<boolean> {
        const wasRead = this.notifications().find(n => n.id === id)?.leida;
        return from(this.supabase
            .from('notificaciones')
            .delete()
            .eq('id', id)
        ).pipe(
            map(({ error }) => {
                if (error) throw error;
                this.notifications.update(prev => prev.filter(n => n.id !== id));
                if (wasRead === false) {
                    this.unreadCount.update(c => Math.max(0, c - 1));
                }
                return true;
            }),
            catchError(error => {
                console.error('Error deleting notification:', error);
                return of(false);
            })
        );
    }

    /**
     * Envía un correo electrónico real usando la Edge Function de Supabase
     */
    sendEmail(subject: string, html: string, attachments?: any[]): Observable<any> {
        // Obtenemos la sesión para el token JWT
        return from(this.supabase.functions.invoke('send-email-notification', {
            body: { subject, html, attachments }
        })).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            }),
            catchError(error => {
                console.error('Error enviando email via Edge Function:', error);
                return of(null);
            })
        );
    }

    /**
     * Envía las políticas del proveedor al correo del cliente
     */
    sendProviderPolicies(solicitud: any) {
        // 1. Obtener perfil del proveedor para sacar el link de las políticas
        from(this.supabase
            .from('perfil_proveedor')
            .select('nombre_negocio, politicas_url')
            .eq('usuario_id', solicitud.proveedor_usuario_id)
            .single()
        ).subscribe(({ data: provider, error }) => {
            if (error || !provider || !provider.politicas_url) {
                console.warn('No se pudieron enviar las políticas: proveedor sin documento o error');
                return;
            }

            const subject = `Políticas de Servicio: ${provider.nombre_negocio}`;
            const html = `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #E11D48;">¡Tu reserva está confirmada!</h2>
                    <p>Hola,</p>
                    <p>Has reservado con éxito el servicio <strong>${solicitud.titulo_evento}</strong> de <strong>${provider.nombre_negocio}</strong>.</p>
                    <p>Adjunto a este correo (o en el link de abajo) encontrarás las políticas de servicio, privacidad y cancelación del proveedor.</p>
                    <div style="margin: 30px 0;">
                        <a href="${provider.politicas_url}" style="background-color: #E11D48; color: white; padding: 12px 24px; text-decoration: none; rounded: 8px; font-weight: bold;">
                            Ver Políticas del Proveedor
                        </a>
                    </div>
                    <p>Gracias por confiar en FestEasy.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">Este es un mensaje automático, por favor no respondas a este correo.</p>
                </div>
            `;

            // Enviar email (La Edge Function usará el email del usuario autenticado - el cliente)
            this.sendEmail(subject, html).subscribe(res => {
                if (res) console.log('✅ Email con políticas enviado al cliente');
            });
        });
    }

    private sendEmailSimulation(notification: Notification) {
        // Si es una notificación de solicitud aceptada/reservada, enviamos el email real
        if (notification.tipo === 'solicitud' && notification.mensaje.includes('reservado')) {
            // El ApiService debería encargarse de llamar a sendProviderPolicies directamente
        }

        console.log(`📧 [EMAIL SIMULATION] To: user_id ${notification.usuario_id}`);
        console.log(`Subject: ${notification.titulo}`);
        console.log(`Body: ${notification.mensaje}`);
        console.log(`-----------------------------------`);
    }

    checkUpcomingEvents() {
        const userId = this.auth.getUserId();
        if (!userId || !this.auth.isProvider()) return;

        // Fetch events for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        from(this.supabase
            .from('solicitudes')
            .select('id, titulo_evento, fecha_servicio')
            .eq('proveedor_usuario_id', userId)
            .eq('fecha_servicio', tomorrowStr)
            .in('estado', ['reservado', 'pagado'])
        ).subscribe(({ data, error }) => {
            if (error || !data) return;

            data.forEach((event: any) => {
                // Only notify if we haven't already notified today
                const storageKey = `notif_remind_${event.id}_${new Date().toISOString().split('T')[0]}`;
                if (localStorage.getItem(storageKey)) return;

                this.createNotification({
                    usuario_id: userId,
                    tipo: 'recordatorio',
                    titulo: 'Recordatorio de evento',
                    mensaje: `Mañana tienes el evento: ${event.titulo_evento}. ¡Prepárate!`,
                    data: { solicitud_id: event.id }
                }).subscribe(() => {
                    localStorage.setItem(storageKey, 'true');
                });
            });
        });
    }
}

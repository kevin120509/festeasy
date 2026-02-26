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

    private sendEmailSimulation(notification: Notification) {
        // This simulates calling a Supabase Edge Function or an external email service
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

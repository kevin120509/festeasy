import { Injectable, inject } from '@angular/core';
import { OneSignal } from 'onesignal-ngx';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private os = inject(OneSignal);
  private supabase = inject(SupabaseService).getClient();
  private auth = inject(AuthService);

  async init() {
    this.os.init({
      appId: environment.onesignalAppId,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: 'OneSignalSDKWorker.js',
    });

    // Forzar el prompt de permisos si aún no los tiene
    try {
      if (this.os.Notifications.permission !== true) {
         await this.os.Slidedown.promptPush();
      }
    } catch (e) {
      console.log('OneSignal prompt result:', e);
    }

    // This is the recommended way to track the Subscription ID
    this.os.User.PushSubscription.addEventListener('change', (subscription: any) => {
        console.log('Push subscription changed:', subscription);
        if (subscription.current && subscription.current.id) {
           this.saveOneSignalId(subscription.current.id);
        }
    });

    // Also check on load with a slight delay to ensure initialization
    setTimeout(() => {
        const currentId = this.os.User.PushSubscription.id;
        if (currentId) {
            this.saveOneSignalId(currentId);
        }
    }, 2000);

    // Escuchar cambios de sesión para registrar el usuario actual al loguearse
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Dar tiempo a AuthService para que cargue el perfil (rol, etc)
        setTimeout(() => {
          const pushId = this.os.User.PushSubscription.id;
          if (pushId) this.saveOneSignalId(pushId);
        }, 3000);
      }
    });
  }

  /**
   * Obtiene el ID de OneSignal del dispositivo y lo guarda en la tabla de perfil correcta
   */
  private async saveOneSignalId(pushId: string) {
    const userId = this.auth.getUserId();
    if (!userId) {
       console.log('No user logged in, delaying pushId save');
       return;
    }

    console.log('📡 OneSignal Player ID:', pushId);
    
    // Determinar en qué tabla guardar según el rol
    const table = this.auth.isProvider() ? 'perfil_proveedor' : 
                  this.auth.isAdmin() ? 'perfil_admin' : 'perfil_cliente';
    
    // Try to update, if the user doesn't have a profile yet (e.g. pending), it will be ignored or fail gracefully.
    const { error } = await this.supabase
      .from(table)
      .update({ onesignal_id: pushId })
      .eq('usuario_id', userId);

    if (error) {
      console.error(`Error guardando OneSignal ID en ${table}:`, error);
    } else {
      console.log(`✅ Dispositivo registrado con éxito en ${table}`);
    }
  }

  /**
   * Envía una notificación Push de forma segura usando la Edge Function de Supabase.
   */
  async sendPushNotification(playerIds: string[], titulo: string, mensaje: string) {
    if (!playerIds || playerIds.length === 0) return;

    try {
      const { data, error } = await this.supabase.functions.invoke('send-push-notification', {
        body: { 
          player_ids: playerIds, 
          titulo: titulo, 
          mensaje: mensaje 
        }
      });

      if (error) throw error;
      console.log('📲 Push notification enviada vía Supabase:', data);
    } catch (error) {
      console.error('❌ Error enviando push notification vía Edge Function:', error);
    }
  }
}

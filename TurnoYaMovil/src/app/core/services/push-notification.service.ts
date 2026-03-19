import { Injectable } from '@angular/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthSessionService } from './auth-session.service';

export interface RegisterDeviceResponse {
  id: string;
  token: string;
  platform: string;
}

export interface DeviceRegistration {
  token: string;
  platform: 'android' | 'ios';
}

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private currentToken: string | null = null;
  private registeredDeviceId: string | null = null;
  private isInitialized = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly authSessionService: AuthSessionService
  ) {}

  /**
   * Inicializa el servicio de notificaciones push.
   * Solicita permisos, registra listeners y sincroniza el token con el backend.
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('[PushNotificationService] Already initialized');
      return;
    }

    try {
      // Verificar si estamos en un dispositivo real
      const permission = await PushNotifications.checkPermissions();
      
      if (permission.receive === 'prompt') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          console.warn('[PushNotificationService] Push permissions not granted');
          return;
        }
      } else if (permission.receive === 'denied') {
        console.warn('[PushNotificationService] Push permissions denied');
        return;
      }

      // Registrar listeners ANTES de obtener el token
      this.registerListeners();

      // Obtener el token de FCM
      await this.register();

      this.isInitialized = true;
      console.log('[PushNotificationService] Initialized successfully');
    } catch (error) {
      console.error('[PushNotificationService] Failed to initialize:', error);
    }
  }

  /**
   * Registra los listeners para eventos de push notifications.
   */
  private registerListeners(): void {
    // Listener para cuando se recibe el token de FCM
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('[PushNotificationService] FCM Token received:', token.value);
      this.currentToken = token.value;
      this.registerTokenWithBackend(token.value);
    });

    // Listener para errores de registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[PushNotificationService] Registration error:', error);
    });

    // Listener para cuando se recibe una notificación
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[PushNotificationService] Notification received:', notification);
        // Aquí se podría mostrar una notificación local o actualizar la UI
        this.handleNotificationReceived(notification);
      }
    );

    // Listener para cuando el usuario interactúa con una notificación
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('[PushNotificationService] Notification action performed:', notification);
        this.handleNotificationAction(notification);
      }
    );
  }

  /**
   * Registra el dispositivo para recibir push notifications.
   */
  async register(): Promise<void> {
    try {
      // Registrar para obtener el token de FCM
      await PushNotifications.register();
      
      // El token vendrá a través del listener de 'registration'
    } catch (error) {
      console.error('[PushNotificationService] Error registering:', error);
    }
  }

  /**
   * Registra el token en el backend via API.
   */
  async registerToken(): Promise<void> {
    if (!this.currentToken) {
      console.warn('[PushNotificationService] No token to register');
      return;
    }

    await this.registerTokenWithBackend(this.currentToken);
  }

  /**
   * Registra el token del dispositivo en el backend.
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    if (!this.authSessionService.hasValidSession()) {
      console.log('[PushNotificationService] No valid session, skipping token registration');
      return;
    }

    try {
      const platform = await this.getPlatform();
      const body: DeviceRegistration = {
        token,
        platform,
      };

      const response = await firstValueFrom(
        this.apiService.post<RegisterDeviceResponse>('/devices/register', body)
      );

      this.registeredDeviceId = response.id;
      console.log('[PushNotificationService] Device registered with ID:', this.registeredDeviceId);
    } catch (error) {
      console.error('[PushNotificationService] Failed to register token:', error);
      // No throw - el registro de token no debe romper la app
    }
  }

  /**
   * Desregistra el token del backend.
   */
  async unregisterToken(): Promise<void> {
    if (!this.registeredDeviceId) {
      console.warn('[PushNotificationService] No registered device ID to unregister');
      return;
    }

    try {
      await firstValueFrom(
        this.apiService.delete<void>(`/devices/register/${this.registeredDeviceId}`)
      );

      console.log('[PushNotificationService] Device unregistered');
      this.registeredDeviceId = null;
    } catch (error) {
      console.error('[PushNotificationService] Failed to unregister token:', error);
      // No throw - el desregistro no debe romper la app
    }
  }

  /**
   * Obtiene el token actual de FCM.
   */
  getToken(): string | null {
    return this.currentToken;
  }

  /**
   * Obtiene el ID del dispositivo registrado en el backend.
   */
  getRegisteredDeviceId(): string | null {
    return this.registeredDeviceId;
  }

  /**
   * Determina la plataforma actual.
   */
  private async getPlatform(): Promise<'android' | 'ios'> {
    // @capacitor/core proporciona información de la plataforma
    const { Capacitor } = await import('@capacitor/core');
    const platform = Capacitor.getPlatform();
    
    if (platform === 'ios') {
      return 'ios';
    }
    
    // Por defecto asumimos Android en dispositivos móviles
    return 'android';
  }

  /**
   * Maneja cuando se recibe una notificación push.
   * Por defecto muestra una notificación local o procesa los datos.
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // Los datos vienen en notification.data
    // Se puede implementar lógica para mostrar notificaciones locales
    // o actualizar el estado de la aplicación
    const { title, body, data } = notification;
    
    console.log('[PushNotificationService] Processing notification:', { title, body, data });
    
    // Emitir evento para que los componentes puedan reaccionar
    window.dispatchEvent(
      new CustomEvent('push-notification', {
        detail: { title, body, data },
      })
    );
  }

  /**
   * Maneja la interacción del usuario con una notificación.
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const { notification, actionId } = action;
    
    console.log('[PushNotificationService] User action:', { actionId, notification });
    
    // Emitir evento para navegación basada en la acción
    window.dispatchEvent(
      new CustomEvent('push-notification-action', {
        detail: { actionId, notification },
      })
    );
  }
}

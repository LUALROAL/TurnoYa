import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { App } from '@capacitor/app';
import { PushNotificationService } from './core/services/push-notification.service';
import { SignalRService } from './core/services/signalr.service';
import { AuthSessionService } from './core/services/auth-session.service';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';

/** Extiende el tipo App de @capacitor/app con los eventos disponibles en v8 */
type AppWithEvents = typeof App;

/**
 * Wrapper tipado para App.addListener con los eventos específicos de v8:
 * 'resume', 'pause', 'appStateChange'
 */
async function addAppListener(
  app: AppWithEvents,
  event: 'resume' | 'pause' | 'appStateChange',
  listener: (...args: unknown[]) => void
): Promise<{ remove: () => void }> {
  return (app as unknown as {
    addListener(event: string, listener: (...args: unknown[]) => void): Promise<{ remove: () => void }>;
  }).addListener(event, listener);
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, AppHeaderComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly appListeners: { remove: () => void }[] = [];

  constructor(
    private readonly pushNotificationService: PushNotificationService,
    private readonly signalRService: SignalRService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Inicializar notificaciones push al arrancar la app
    // Esto solicita permisos y registra el dispositivo con FCM
    await this.pushNotificationService.init();

    // Inicializar SignalR solo si hay sesión válida
    if (this.authSessionService.hasValidSession()) {
      await this.signalRService.connect();
    }

    // Suscribirse a cambios de sesión para reconectar/desconectar
    this.authSessionService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe((session) => {
        if (session && !this.signalRService.isConnected()) {
          this.signalRService.connect();
        } else if (!session && this.signalRService.isConnected()) {
          this.signalRService.disconnect();
        }
      });

    // Lifecycle hooks con Capacitor App plugin (v8 API: resume/pause)
    await this.setupCapacitorLifecycle();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalRService.disconnect();
    this.appListeners.forEach((l) => l.remove());
  }

  /**
   * Configura los lifecycle hooks de Capacitor para manejar
   * background/foreground de la app y reconectar SignalR.
   *
   * API v8: 'resume' (foreground), 'pause' (background).
   * En web se traduce a visibilitychange, así que funciona también ahí.
   */
  private async setupCapacitorLifecycle(): Promise<void> {
    try {
      // App vuelve al foreground — reconectar SignalR
      const resumeListener = await App.addListener('resume', async () => {
        console.log('[AppComponent] App resumed (foreground) — reconnecting SignalR');
        if (this.authSessionService.hasValidSession()) {
          await this.signalRService.reconnect();
        }
      });
      this.appListeners.push(resumeListener);

      // App entra en background — desconectar SignalR para ahorrar batería
      const pauseListener = await App.addListener('pause', async () => {
        console.log('[AppComponent] App paused (background) — disconnecting SignalR');
        await this.signalRService.disconnect();
      });
      this.appListeners.push(pauseListener);

      // Estado general de la app
      const stateListener = await App.addListener('appStateChange', ({ isActive }) => {
        console.debug('[AppComponent] App state changed, isActive:', isActive);
      });
      this.appListeners.push(stateListener);
    } catch (error) {
      // Estos eventos solo existen en Capacitor nativo; en web son simulados
      console.warn('[AppComponent] Capacitor App listeners not available:', error);
    }
  }
}

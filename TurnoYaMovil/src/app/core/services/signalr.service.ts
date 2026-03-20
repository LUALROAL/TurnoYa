import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject, Observable, EMPTY } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { AppointmentEventDto } from '../models/appointment-event.model';
import { AuthSessionService } from './auth-session.service';
import { environment } from '../../../environments/environment';

/** Max reconnection attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 5;

@Injectable({
  providedIn: 'root',
})
export class SignalRService implements OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);

  private hubConnection: signalR.HubConnection | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = true;

  /** Emitted when the WebSocket connection is successfully established */
  readonly connectionOpened$ = new Subject<void>();

  /** Emitted when the WebSocket connection is closed or lost */
  readonly connectionClosed$ = new Subject<void>();

  /** Emitted on any connection-level error */
  readonly connectionError$ = new Subject<Error>();

  /** Appointment events */
  readonly appointmentCreated$ = new Subject<AppointmentEventDto>();
  readonly appointmentConfirmed$ = new Subject<AppointmentEventDto>();
  readonly appointmentCancelled$ = new Subject<AppointmentEventDto>();
  readonly appointmentCompleted$ = new Subject<AppointmentEventDto>();
  readonly appointmentNoShow$ = new Subject<AppointmentEventDto>();

  constructor() {}

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Establishes SignalR WebSocket connection with JWT token.
   * Idempotent — if already connected, does nothing.
   */
  async connect(): Promise<void> {
    const token = this.authSessionService.getAccessToken();

    if (!token) {
      console.warn('[SignalRService] No valid session — skipping connect');
      return;
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.debug('[SignalRService] Already connected');
      return;
    }

    const hubUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}${environment.signalRHubUrl}`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          return this.nextRetryDelay(retryContext.previousRetryCount);
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.registerHandlers();

    this.hubConnection.onclose((error?: Error) => {
      console.warn('[SignalRService] Connection closed', error?.message);
      this.connectionClosed$.next();

      if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.scheduleReconnect();
      } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[SignalRService] Max reconnect attempts reached — giving up');
        this.connectionError$.next(
          new Error(`SignalR reconnection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`)
        );
      }
    });

    this.hubConnection.onreconnecting((error?: Error) => {
      console.warn('[SignalRService] Reconnecting…', error?.message);
    });

    this.hubConnection.onreconnected((connectionId?: string) => {
      console.log('[SignalRService] Reconnected, connectionId:', connectionId);
      this.reconnectAttempts = 0;
      this.connectionOpened$.next();
    });

    try {
      await this.hubConnection.start();
      console.log('[SignalRService] Connected successfully');
      this.reconnectAttempts = 0;
      this.connectionOpened$.next();
    } catch (error) {
      console.error('[SignalRService] Failed to connect', error);
      this.connectionError$.next(error as Error);
    }
  }

  /**
   * Stops the SignalR connection gracefully.
   * Call this when the app goes to background.
   */
  async disconnect(): Promise<void> {
    if (!this.hubConnection) return;

    this.shouldReconnect = false;

    try {
      await this.hubConnection.stop();
      console.log('[SignalRService] Disconnected');
    } catch (error) {
      console.error('[SignalRService] Error while disconnecting', error);
    } finally {
      this.hubConnection = null;
      this.connectionClosed$.next();
    }
  }

  /**
   * Called by app.component when app enters foreground.
   * Re-authenticates and reconnects if needed.
   */
  async reconnect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.shouldReconnect = true;
    await this.connect();
  }

  /** Returns the current connection state */
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('AppointmentCreated', (event: AppointmentEventDto) => {
      console.debug('[SignalRService] AppointmentCreated', event);
      this.appointmentCreated$.next(event);
    });

    this.hubConnection.on('AppointmentConfirmed', (event: AppointmentEventDto) => {
      console.debug('[SignalRService] AppointmentConfirmed', event);
      this.appointmentConfirmed$.next(event);
    });

    this.hubConnection.on('AppointmentCancelled', (event: AppointmentEventDto) => {
      console.debug('[SignalRService] AppointmentCancelled', event);
      this.appointmentCancelled$.next(event);
    });

    this.hubConnection.on('AppointmentCompleted', (event: AppointmentEventDto) => {
      console.debug('[SignalRService] AppointmentCompleted', event);
      this.appointmentCompleted$.next(event);
    });

    this.hubConnection.on('AppointmentNoShow', (event: AppointmentEventDto) => {
      console.debug('[SignalRService] AppointmentNoShow', event);
      this.appointmentNoShow$.next(event);
    });
  }

  /**
   * Exponential backoff: 2^n seconds, capped at 30s.
   * Only schedules if reconnect is allowed and under max attempts.
   */
  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    const delay = this.nextRetryDelay(this.reconnectAttempts);
    this.reconnectAttempts++;

    console.debug(`[SignalRService] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Computes exponential backoff delay in ms.
   * Formula: min(2^n * 1000, 30000) where n = attempt number (0-indexed).
   */
  private nextRetryDelay(attemptNumber: number): number {
    const seconds = Math.pow(2, attemptNumber);
    return Math.min(seconds * 1000, 30_000);
  }
}

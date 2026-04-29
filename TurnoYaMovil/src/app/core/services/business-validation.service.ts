import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentEventDto } from '../models/appointment-event.model';
import { SignalRService } from './signalr.service';
import { AppointmentsService } from '../../features/appointments/services/appointments.service';
import { NotifyService } from './notify.service';

/** Key prefix para localStorage */
const VALIDATION_KEY_PREFIX = 'validated-appointment-';

/** Duración máxima: 30 días */
const VALIDATION_EXPIRY_DAYS = 30;

@Injectable({
  providedIn: 'root',
})
export class BusinessValidationService implements OnDestroy {
  private readonly signalRService = inject(SignalRService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly notify = inject(NotifyService);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.setupAppointmentCompletedListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Escucha eventos de SignalR y muestra el modal de validación
   * cuando una cita del usuario actual se completa.
   */
  private setupAppointmentCompletedListener(): void {
    console.log('[BusinessValidationService] Setting up listener for AppointmentCompleted');
    this.signalRService.appointmentCompleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: AppointmentEventDto) => {
          console.log('[BusinessValidationService] Received AppointmentCompleted:', event);
          this.handleAppointmentCompleted(event);
        },
        error: (error: unknown) => {
          console.error('[BusinessValidationService] Error listening to appointment completed:', error);
        },
      });
  }

  /**
   * Maneja el evento de cita completada:
   * 1. Verifica si el appointment ya fue validado
   * 2. Si no, muestra el alert/toast de validación
   */
  private handleAppointmentCompleted(event: AppointmentEventDto): void {
    // Verificar si ya se validó esta cita
    if (this.hasBeenValidated(event.appointmentId)) {
      console.log('[BusinessValidationService] Appointment already validated:', event.appointmentId);
      return;
    }

    // Mostrar prompt de validación usando Toast
    this.showValidationPrompt(event);
  }

  /**
   * Muestra un prompt de validación usando Toast.
   */
  private async showValidationPrompt(event: AppointmentEventDto): Promise<void> {
    try {
      // Mostrar toast simple informando
      this.notify.showSuccess(
        `¡Cita completada! Podés calificar "${event.businessName}" desde Mis Citas`
      );
      
      console.log('[BusinessValidationService] Validation prompt shown:', event.businessName);
    } catch (error) {
      console.error('[BusinessValidationService] Error showing validation prompt:', error);
    }
  }

  /**
   * Redirige a la página de validación (puede ser una página dedicada o mostrar el modal).
   */
  redirectToValidation(): void {
    // Esta función puede expandirse para mostrar un modal o redirigir a una página
    // Por ahora es un placeholder para expandir después
  }

  /**
   * Verifica si una cita ya fue procesada (el usuario ya validó u omitió).
   */
  hasBeenValidated(appointmentId: string): boolean {
    const key = this.getStorageKey(appointmentId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return false;
    }

    try {
      const data = JSON.parse(stored) as { expiresAt: number };
      // Verificar si no ha expirado
      return data.expiresAt > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Marca una cita como procesada.
   */
  private markAsValidated(appointmentId: string): void {
    const key = this.getStorageKey(appointmentId);
    const expiresAt = Date.now() + VALIDATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt,
      })
    );
  }

  /**
   * Obtiene la clave de localStorage para un appointment.
   */
  private getStorageKey(appointmentId: string): string {
    return `${VALIDATION_KEY_PREFIX}${appointmentId}`;
  }

  /**
   * Limpia citas validadas que ya expiraron.
   * Útil para housekeeping.
   */
  cleanExpiredValidations(): void {
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(VALIDATION_KEY_PREFIX)) {
        continue;
      }

      try {
        const data = JSON.parse(localStorage.getItem(key) as string) as { expiresAt: number };
        if (data.expiresAt <= now) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid data, remove anyway
        localStorage.removeItem(key);
      }
    }
  }
}
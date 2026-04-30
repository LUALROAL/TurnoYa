import { inject, Injectable, OnDestroy } from '@angular/core';
import { ActionSheetController } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentEventDto } from '../models/appointment-event.model';
import { SignalRService } from './signalr.service';
import { AppointmentsService } from '../../features/appointments/services/appointments.service';
import { NotifyService } from './notify.service';
import { AuthService } from '../../features/auth/services/auth.service';

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
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly authService = inject(AuthService);

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
   * 1. Verifica si el usuario es owner (si es owner, no puede calificar)
   * 2. Verifica si el appointment ya fue validado
   * 3. Si no, muestra el alert de calificación
   */
  private async handleAppointmentCompleted(event: AppointmentEventDto): Promise<void> {
    const isOwner = this.authService.getIsOwner();
    console.log('[BusinessValidationService] handleAppointmentCompleted:', {
      appointmentId: event.appointmentId,
      customerId: event.customerId,
      businessId: event.businessId,
      isOwner: isOwner
    });

    // NO mostrar modal si el usuario es owner del negocio
    if (isOwner) {
      console.log('[BusinessValidationService] User is owner, skipping validation modal');
      return;
    }

    // Verificar si ya se validó esta cita
    if (this.hasBeenValidated(event.appointmentId)) {
      console.log('[BusinessValidationService] Appointment already validated:', event.appointmentId);
      return;
    }

    console.log('[BusinessValidationService] Showing rating alert for appointment:', event.appointmentId, 'customerId:', event.customerId);

    // Mostrar alert de calificación directamente
    await this.showRatingAlert(event);
  }

  /**
   * Muestra un alert de calificación con estrellas.
   */
  private async showRatingAlert(event: AppointmentEventDto): Promise<void> {
    try {
      const actionSheet = await this.actionSheetController.create({
        header: `¡Cita completada en "${event.businessName}"!`,
        subHeader: '¿Cuánto recomiendas este negocio?',
        buttons: [
          {
            text: '⭐⭐⭐⭐⭐ Excelente',
            handler: () => { this.submitValidation(event, 5); }
          },
          {
            text: '⭐⭐⭐⭐ Muy Bueno',
            handler: () => { this.submitValidation(event, 4); }
          },
          {
            text: '⭐⭐⭐ Bueno',
            handler: () => { this.submitValidation(event, 3); }
          },
          {
            text: '⭐⭐ Regular',
            handler: () => { this.submitValidation(event, 2); }
          },
          {
            text: '⭐ Malo',
            handler: () => { this.submitValidation(event, 1); }
          },
          {
            text: 'Cancelar',
            role: 'cancel'
          }
        ]
      });

      await actionSheet.present();
      console.log('[BusinessValidationService] Rating action sheet shown for:', event.businessName);
    } catch (error) {
      console.error('[BusinessValidationService] Error showing rating alert:', error);
    }
  }

  /**
   * Envía la validación al backend.
   */
  private submitValidation(event: AppointmentEventDto, rating: number): void {
    console.log('[BusinessValidationService] Submitting validation:', {
      appointmentId: event.appointmentId,
      businessId: event.businessId,
      customerId: event.customerId,
      rating: rating
    });

    this.appointmentsService
      .createBusinessValidation({
        appointmentId: event.appointmentId,
        businessId: event.businessId,
        customerId: event.customerId, // Enviar el customerId para que el backend pueda verificar
        knowsBusiness: true,
        rating: rating,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.showSuccess(`¡Gracias! Calificación de ${rating} estrellas enviada`);
          this.markAsValidated(event.appointmentId);
        },
        error: (error) => {
          console.error('[BusinessValidationService] Error submitting validation:', error);
          // Mostrar mensaje de error friendly al usuario
          const errorMessage = this.parseValidationError(error);
          this.notify.showError(errorMessage);
        },
      });
  }

  /**
   * Parses the error response from the backend and returns a user-friendly message.
   */
  private parseValidationError(error: unknown): string {
    // Handle HttpErrorResponse
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as { status: number; error?: unknown };
      
      // Parse error body
      let backendMessage = '';
      if (httpError.error) {
        if (typeof httpError.error === 'string') {
          backendMessage = httpError.error;
        } else if (typeof httpError.error === 'object' && httpError.error !== null) {
          const errorObj = httpError.error as Record<string, unknown>;
          backendMessage = (errorObj['message'] as string) || (errorObj['title'] as string) || '';
        }
      }

      switch (httpError.status) {
        case 400:
          // Bad request - usually means appointment not completed or not found
          if (backendMessage.toLowerCase().includes('completada') || 
              backendMessage.toLowerCase().includes('completed')) {
            return 'No podés calificar este negocio porque la cita aún no está completada.';
          }
          return backendMessage || 'Error al enviar la calificación. Verificá los datos e intentá nuevamente.';
        
        case 401:
          return 'Tu sesión expiró. Iniciá sesión nuevamente.';
        
        case 403:
          return 'No tenés permiso para calificar este negocio.';
        
        case 404:
          return 'La cita no fue encontrada. Puede que ya haya sido procesada.';
        
        case 500:
          return 'Error del servidor. Intentá nuevamente en unos minutos.';
        
        default:
          return backendMessage || 'Ocurrió un error al enviar tu calificación.';
      }
    }
    
    // Network error or other
    return 'Error de conexión. Verificá tu internet e intentá nuevamente.';
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
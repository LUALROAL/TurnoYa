/**
 * DTO para la configuración de un negocio
 */
export interface BusinessSettings {
  /**
   * Horarios de trabajo del negocio (JSON)
   * Ejemplo: { "Monday": { "Open": "09:00", "Close": "18:00", "IsOpen": true }, ... }
   */
  workingHours?: string;

  /**
   * Días de anticipación permitidos para reservar (ej: 30 días)
   */
  bookingAdvanceDays: number;

  /**
   * Horas mínimas de anticipación para cancelar sin penalización (ej: 24 horas)
   */
  cancellationHours: number;

  /**
   * Indica si el negocio requiere depósito para reservas
   */
  requiresDeposit: boolean;

  /**
   * Política de no-show del negocio
   */
  noShowPolicy?: string;

  /**
   * Duración del slot por defecto en minutos (ej: 30 min)
   */
  defaultSlotDuration: number;

  /**
   * Tiempo de buffer entre citas en minutos (ej: 5 min)
   */
  bufferTimeBetweenAppointments: number;
}

/**
 * Configuración de horarios de trabajo por día
 */
export interface WorkingDayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

/**
 * Estructura de horarios de trabajo semanales
 */
export interface WorkingHoursSchedule {
  monday?: WorkingDayHours;
  tuesday?: WorkingDayHours;
  wednesday?: WorkingDayHours;
  thursday?: WorkingDayHours;
  friday?: WorkingDayHours;
  saturday?: WorkingDayHours;
  sunday?: WorkingDayHours;
}

// Reutilizamos los DTOs del negocio porque tienen exactamente la misma estructura
import {
  WorkingHoursDto,
  DayScheduleDto
} from '../../owner-business/models/business-schedule.models';

export interface EmployeeWorkingHoursDto extends WorkingHoursDto {
  blockedDates: string[]; // Fechas en formato YYYY-MM-DD
}

export { WorkingHoursDto, DayScheduleDto };

export interface DayScheduleDto {
  isOpen: boolean;
  openTime?: string | null;      // null permitido
  closeTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}

export interface WorkingHoursDto {
  monday: DayScheduleDto;
  tuesday: DayScheduleDto;
  wednesday: DayScheduleDto;
  thursday: DayScheduleDto;
  friday: DayScheduleDto;
  saturday: DayScheduleDto;
  sunday: DayScheduleDto;
}

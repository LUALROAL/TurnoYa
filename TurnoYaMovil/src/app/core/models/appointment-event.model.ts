/**
 * DTO que llega del NotificationsHub de SignalR.
 * Coincide con AppointmentEventDto.cs del backend.
 */
export interface AppointmentEventDto {
  appointmentId: string;
  eventType: 'Created' | 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow';
  customerId: string;
  businessId: string;
  businessName: string;
  serviceName: string;
  scheduledDate: string;
  status: string;
  reason?: string;
}

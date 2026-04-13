/**
 * DTO for employee events received via SignalR.
 * Corresponds to TurnoYa.Core.DTOs.EmployeeEventDto
 */
export interface EmployeeEventDto {
  employeeId: string;
  businessId: string;
  businessName: string;
  position: string;
  eventType: 'Linked' | 'Unlinked';
  timestamp: string;
}
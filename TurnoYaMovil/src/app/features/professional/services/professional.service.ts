import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface EmployeeAppointment {
  id: string;
  serviceId: string;
  serviceName: string;
  businessId: string;
  businessName: string;
  userId: string;
  userName: string;
  scheduledDate: string;
  endDate: string;
  status: string;
  notes?: string;
  totalAmount: number;
}

export interface EmployeePermissions {
  employeeId: string;
  canViewAppointments: boolean;
  canAcceptAppointments: boolean;
  canRejectAppointments: boolean;
  canCancelAppointments: boolean;
  canRescheduleAppointments: boolean;
  canManageSchedule: boolean;
  canViewServices: boolean;
  canManageServices: boolean;
}

export interface InvitationResponse {
  invitationLink: string;
  shortCode: string;
  expiresAt: string;
  employeeName: string;
  employeeId: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  employeeId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {
  private readonly baseUrl = '/api/employees';

  constructor(private api: ApiService) {}

  /**
   * Obtiene las citas asignadas al empleado actual
   */
  getMyAppointments(from?: string, to?: string): Observable<EmployeeAppointment[]> {
    let url = `${this.baseUrl}/my-appointments`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    return this.api.get<EmployeeAppointment[]>(url);
  }

  /**
   * Obtiene los permisos del empleado
   */
  getPermissions(employeeId: string): Observable<EmployeePermissions> {
    return this.api.get<EmployeePermissions>(`${this.baseUrl}/${employeeId}/permissions`);
  }

  /**
   * Actualiza los permisos del empleado
   */
  updatePermissions(employeeId: string, permissions: Partial<EmployeePermissions>): Observable<EmployeePermissions> {
    return this.api.put<EmployeePermissions>(`${this.baseUrl}/${employeeId}/permissions`, permissions);
  }

  /**
   * Genera un enlace de invitación para un empleado
   */
  generateInvitation(employeeId: string): Observable<InvitationResponse> {
    return this.api.post<InvitationResponse>(`${this.baseUrl}/${employeeId}/invite`, {});
  }

  /**
   * Acepta una invitación de empleo
   */
  acceptInvitation(token: string): Observable<AcceptInvitationResponse> {
    return this.api.post<AcceptInvitationResponse>('/api/employees/accept-invitation', { token });
  }

  /**
   * Acepta una invitación usando el código corto
   */
  acceptInvitationByCode(code: string): Observable<AcceptInvitationResponse> {
    return this.api.post<AcceptInvitationResponse>('/api/employees/accept-invitation-by-code', { code });
  }

  /**
   * Obtiene los empleados asociados al usuario actual
   */
  getMyEmployees(): Observable<any[]> {
    // This would require a new endpoint - for now return empty
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }
}

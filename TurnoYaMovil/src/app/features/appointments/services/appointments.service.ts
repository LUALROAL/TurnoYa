import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AppointmentItem, CreateAppointmentRequest } from '../models';
import { AvailabilityResponse } from '../models/availability.models';

export interface BusinessValidationRequest {
  businessId: string;
  appointmentId: string;
  knowsBusiness: boolean;
  rating?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private readonly api = inject(ApiService);

  create(request: CreateAppointmentRequest): Observable<AppointmentItem> {
    return this.api.post<AppointmentItem>('/api/appointments', request);
  }

  getMy(): Observable<AppointmentItem[]> {
    return this.api.get<AppointmentItem[]>('/api/appointments/my');
  }

  getByBusiness(
    businessId: string,
    params?: { from?: string; to?: string; status?: string }
  ): Observable<AppointmentItem[]> {
    return this.api.get<AppointmentItem[]>(`/api/appointments/business/${businessId}`, {
      params,
    });
  }

  confirm(id: string): Observable<void> {
    return this.api.patch<void>(`/api/appointments/${id}/confirm`, {});
  }

  complete(id: string): Observable<void> {
    return this.api.patch<void>(`/api/appointments/${id}/complete`, {});
  }

  markNoShow(id: string): Observable<void> {
    return this.api.patch<void>(`/api/appointments/${id}/noshow`, {});
  }

  cancel(id: string, reason?: string | null): Observable<void> {
    return this.api.patch<void>(`/api/appointments/${id}/cancel`, {
      reason: reason || null,
    });
  }

  createBusinessValidation(request: BusinessValidationRequest): Observable<void> {
    return this.api.post<void>('/api/business-validation', request);
  }

  getAvailability(
    businessId: string,
    serviceId: string,
    date: string,
    employeeId?: string
  ): Observable<AvailabilityResponse> {
    let url = `/api/availability/slots?businessId=${businessId}&serviceId=${serviceId}&date=${date}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    return this.api.get<AvailabilityResponse>(url);
  }

  getAvailableDays(
    businessId: string,
    serviceId: string,
    from: string,
    to: string,
    employeeId?: string
  ): Observable<string[]> {
    let url = `/api/availability/days?businessId=${businessId}&serviceId=${serviceId}&from=${from}&to=${to}`;
    if (employeeId) {
      url += `&employeeId=${employeeId}`;
    }
    return this.api.get<string[]>(url);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AppointmentItem, CreateAppointmentRequest } from '../models';

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
}

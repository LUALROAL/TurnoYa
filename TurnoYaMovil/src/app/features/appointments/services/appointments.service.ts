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
}

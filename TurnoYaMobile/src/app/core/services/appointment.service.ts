import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, CreateAppointmentDto, AvailabilitySlot } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/Appointments`;

  constructor(private http: HttpClient) {}

  getMyAppointments(status?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Appointment[]>(`${this.apiUrl}/my`, { params });
  }

  getById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, data);
  }

  cancel(id: string, reason?: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  confirm(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/confirm`, {});
  }

  complete(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/complete`, {});
  }

  markNoShow(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/noshow`, {});
  }

  getBusinessAppointments(businessId: string, status?: string, from?: string, to?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<Appointment[]>(`${this.apiUrl}/business/${businessId}`, { params });
  }

  getAvailability(businessId: string, serviceId: string, date: string): Observable<AvailabilitySlot[]> {
    const params = new HttpParams()
      .set('businessId', businessId)
      .set('serviceId', serviceId)
      .set('date', date);
    return this.http.get<AvailabilitySlot[]>(`${this.apiUrl}/availability`, { params });
  }
}

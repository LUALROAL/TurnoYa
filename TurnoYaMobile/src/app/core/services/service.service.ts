import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Service, CreateServiceDto } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private apiUrl = `${environment.apiUrl}/Services`;

  constructor(private http: HttpClient) {}

  getByBusiness(businessId: string): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/business/${businessId}`);
  }

  getById(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateServiceDto): Observable<Service> {
    // El backend espera /Services/business/{businessId}
    return this.http.post<Service>(`${this.apiUrl}/business/${data.businessId}`, data);
  }

  update(id: string, data: Partial<CreateServiceDto>): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignEmployees(serviceId: string, employeeIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${serviceId}/employees`, { employeeIds });
  }

  getAssignedEmployees(serviceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${serviceId}/employees`);
  }
}

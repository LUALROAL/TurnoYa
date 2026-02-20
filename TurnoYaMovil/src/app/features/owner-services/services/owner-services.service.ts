import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { OwnerService, CreateServiceRequest, UpdateServiceRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class OwnerServicesService {
  private readonly api = inject(ApiService);

  getByBusinessId(businessId: string): Observable<OwnerService[]> {
    return this.api.get<OwnerService[]>(`/api/services/business/${businessId}`);
  }

  getById(serviceId: string): Observable<OwnerService> {
    return this.api.get<OwnerService>(`/api/services/${serviceId}`);
  }

  create(businessId: string, request: CreateServiceRequest): Observable<OwnerService> {
    return this.api.post<OwnerService>(`/api/services/business/${businessId}`, request);
  }

  update(serviceId: string, request: UpdateServiceRequest): Observable<OwnerService> {
    return this.api.put<OwnerService>(`/api/services/${serviceId}`, request);
  }

  delete(serviceId: string): Observable<void> {
    return this.api.delete<void>(`/api/services/${serviceId}`);
  }
}

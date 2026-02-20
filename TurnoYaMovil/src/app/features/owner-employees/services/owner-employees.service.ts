import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateEmployeeRequest,
  OwnerEmployee,
  UpdateEmployeeRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class OwnerEmployeesService {
  private readonly api = inject(ApiService);

  getByBusinessId(businessId: string): Observable<OwnerEmployee[]> {
    return this.api.get<OwnerEmployee[]>(`/api/employees/business/${businessId}`);
  }

  getById(employeeId: string): Observable<OwnerEmployee> {
    return this.api.get<OwnerEmployee>(`/api/employees/${employeeId}`);
  }

  create(
    businessId: string,
    request: CreateEmployeeRequest
  ): Observable<OwnerEmployee> {
    return this.api.post<OwnerEmployee>(
      `/api/employees/business/${businessId}`,
      request
    );
  }

  update(
    employeeId: string,
    request: UpdateEmployeeRequest
  ): Observable<OwnerEmployee> {
    return this.api.put<OwnerEmployee>(`/api/employees/${employeeId}`, request);
  }

  delete(employeeId: string): Observable<void> {
    return this.api.delete<void>(`/api/employees/${employeeId}`);
  }
}

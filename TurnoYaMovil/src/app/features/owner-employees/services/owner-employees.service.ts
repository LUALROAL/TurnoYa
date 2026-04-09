import { Injectable, inject } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateEmployeeRequest,
  OwnerEmployee,
  UpdateEmployeeRequest,
} from '../models';
import { EmployeeWorkingHoursDto, WorkingHoursDto } from '../models/employee-schedule.models';

@Injectable({
  providedIn: 'root',
})
export class OwnerEmployeesService {
  private readonly api = inject(ApiService);

  getByBusinessId(businessId: string): Observable<OwnerEmployee[]> {
    return this.api.get<OwnerEmployee[]>(`/api/employees/business/${businessId}`);
  }

  getMyEmployeeProfile(businessId: string): Observable<OwnerEmployee> {
    return this.api.get<OwnerEmployee>(`/api/employees/me?businessId=${businessId}`);
  }

  getById(employeeId: string): Observable<OwnerEmployee> {
    return this.api.get<OwnerEmployee>(`/api/employees/${employeeId}`);
  }

  create(
    businessId: string,
    request: CreateEmployeeRequest,
    photoFile?: File
  ): Observable<OwnerEmployee> {
    const formData = new FormData();

    this.appendRequestToFormData(formData, request);

    // Añadir foto si existe
    if (photoFile) {
      formData.append('photo', photoFile, photoFile.name);
    }

    return this.api.post<OwnerEmployee>(
      `/api/employees/business/${businessId}`,
      formData
    );
  }

  update(
    employeeId: string,
    request: UpdateEmployeeRequest,
    photoFile?: File
  ): Observable<OwnerEmployee> {
    const formData = new FormData();

    this.appendRequestToFormData(formData, request);

    if (photoFile) {
      formData.append('photo', photoFile, photoFile.name);
    }

    return this.api.put<OwnerEmployee>(`/api/employees/${employeeId}`, formData);
  }

  delete(employeeId: string): Observable<void> {
    return this.api.delete<void>(`/api/employees/${employeeId}`);
  }

  /**
   * Desvincula un empleado del negocio
   */
  unlink(employeeId: string): Observable<OwnerEmployee> {
    return this.api.post<OwnerEmployee>(`/api/employees/${employeeId}/unlink`, {});
  }

  // ===== MÉTODOS PARA HORARIOS DE EMPLEADO =====

  /**
   * Obtiene el horario de un empleado
   */
  getEmployeeSchedule(employeeId: string): Observable<EmployeeWorkingHoursDto | null> {
    return this.api
      .get<EmployeeWorkingHoursDto>(`/api/EmployeeSchedule/GetByEmployee/${employeeId}`)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Crea el horario para un empleado
   */
  createEmployeeSchedule(
    employeeId: string,
    schedule: EmployeeWorkingHoursDto
  ): Observable<void> {
    return this.api.post<void>(
      `/api/EmployeeSchedule/Create?employeeId=${employeeId}`,
      schedule
    );
  }

  /**
   * Actualiza el horario de un empleado
   */
  updateEmployeeSchedule(
    employeeId: string,
    schedule: EmployeeWorkingHoursDto
  ): Observable<void> {
    return this.api.put<void>(
      `/api/EmployeeSchedule/Update/${employeeId}`,
      schedule
    );
  }

  private appendRequestToFormData(
    formData: FormData,
    request: CreateEmployeeRequest | UpdateEmployeeRequest
  ): void {
    Object.entries(request).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item.toString()));
        return;
      }

      formData.append(key, value.toString());
    });
  }
}

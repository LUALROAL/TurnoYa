import { Injectable, inject } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import {
  OwnerBusiness,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  BusinessSettings,
} from '../models';
import { HttpHeaders } from '@angular/common/http';
import { WorkingHoursDto } from '../models/business-schedule.models';

@Injectable({
  providedIn: 'root',
})
export class OwnerBusinessService {
  private readonly api = inject(ApiService);
  private readonly session = inject(AuthSessionService);

  /**
   * Get all businesses owned by the authenticated user
   */
  getMyBusinesses(): Observable<OwnerBusiness[]> {
    const currentSession = this.session.getSession();
    const ownerId = currentSession?.user?.id;

    if (!ownerId) {
      throw new Error('No hay sesión de usuario activa');
    }

    return this.api.get<OwnerBusiness[]>(`/api/business/owner/${ownerId}`);
  }

  /**
   * Get businesses by specific owner ID
   */
  getByOwnerId(ownerId: string): Observable<OwnerBusiness[]> {
    return this.api.get<OwnerBusiness[]>(`/api/business/owner/${ownerId}`);
  }

  /**
   * Get a specific business by ID
   */
  getById(id: string): Observable<OwnerBusiness> {
    return this.api.get<OwnerBusiness>(`/api/business/${id}`);
  }

  /**
   * Create a new business with images
   */
  createWithImages(business: CreateBusinessRequest, images: File[]): Observable<OwnerBusiness> {
    const formData = new FormData();

    // Añadir todos los campos del negocio
    Object.entries(business).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Añadir imágenes
    images.forEach(image => {
      formData.append('images', image, image.name);
    });

    return this.api.post<OwnerBusiness>('/api/business', formData);
  }

  /**
   * Update an existing business with images
   */
  updateWithImages(
    id: string,
    business: UpdateBusinessRequest,
    images: File[]
  ): Observable<OwnerBusiness> {
    const formData = new FormData();

    // Añadir todos los campos del negocio
    Object.entries(business).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Añadir nuevas imágenes
    images.forEach(image => {
      formData.append('images', image, image.name);
    });

    return this.api.put<OwnerBusiness>(`/api/business/${id}`, formData);
  }

  /**
   * Legacy create method (sin imágenes)
   */
  create(business: CreateBusinessRequest): Observable<OwnerBusiness> {
    return this.api.post<OwnerBusiness>('/api/business', business);
  }

  /**
   * Legacy update method (sin imágenes)
   */
  update(
    id: string,
    business: UpdateBusinessRequest
  ): Observable<OwnerBusiness> {
    return this.api.put<OwnerBusiness>(`/api/business/${id}`, business);
  }

  /**
   * Delete a business
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/business/${id}`);
  }

  /**
   * Toggle business active status
   */
  toggleActive(id: string, isActive: boolean): Observable<OwnerBusiness> {
    // Usar FormData para cumplir con el backend (multipart/form-data)
    const formData = new FormData();
    formData.append('isActive', isActive.toString());
    return this.api.put<OwnerBusiness>(
      `/api/business/${id}`,
      formData
    );
  }

  /**
   * Get business settings
   */
  getSettings(businessId: string): Observable<BusinessSettings> {
    return this.api.get<BusinessSettings>(`/api/business/${businessId}/settings`);
  }

  /**
   * Update business settings
   */
  updateSettings(
    businessId: string,
    settings: BusinessSettings
  ): Observable<BusinessSettings> {
    return this.api.put<BusinessSettings>(`/api/business/${businessId}/settings`, settings);
  }

  // ===== MÉTODOS PARA HORARIOS DE ATENCIÓN =====

/**
 * Obtiene el horario de un negocio
 */
// getSchedule(businessId: string): Observable<WorkingHoursDto> {
//   return this.api.get<WorkingHoursDto>(`/api/BusinessSchedule/GetByBusiness/${businessId}`);
// }

getSchedule(businessId: string): Observable<WorkingHoursDto | null> {
  return this.api.get<WorkingHoursDto>(`/api/BusinessSchedule/GetByBusiness/${businessId}`)
    .pipe(
      catchError(error => {
        if (error.status === 404) {
          return of(null); // Devuelve null cuando no existe (sin error)
        }
        return throwError(() => error); // Re-lanza otros errores (500, etc.)
      })
    );
}

/**
 * Crea el horario de un negocio
 */
createSchedule(businessId: string, schedule: WorkingHoursDto): Observable<void> {
  return this.api.post<void>(`/api/BusinessSchedule/Create?businessId=${businessId}`, schedule);
}

/**
 * Actualiza el horario de un negocio
 */
updateSchedule(businessId: string, schedule: WorkingHoursDto): Observable<void> {
  return this.api.put<void>(`/api/BusinessSchedule/Update/${businessId}`, schedule);
}

/**
 * Elimina el horario de un negocio (si aplica)
 */
deleteSchedule(businessId: string): Observable<void> {
  return this.api.delete<void>(`/api/BusinessSchedule/Delete/${businessId}`);
}
}

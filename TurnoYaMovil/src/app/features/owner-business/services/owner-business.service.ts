import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import {
  OwnerBusiness,
  CreateBusinessRequest,
  UpdateBusinessRequest,
} from '../models';
import { BusinessSettings } from '../models/business-settings.model';
import { HttpHeaders } from '@angular/common/http';
import { WorkingHoursDto } from '../models/business-schedule.models';
import { BusinessService } from '../../business/services/business.service';
import { BusinessListItem } from '../../business/models';

@Injectable({
  providedIn: 'root',
})
export class OwnerBusinessService {
  private readonly api = inject(ApiService);
  private readonly session = inject(AuthSessionService);
  private readonly businessService = inject(BusinessService);

  /**
   * Get all businesses owned by the authenticated user
   * Combines businesses where user is owner and where user is employee
   */
  getMyBusinesses(): Observable<OwnerBusiness[]> {
    const currentSession = this.session.getSession();
    const ownerId = currentSession?.user?.id;

    if (!ownerId) {
      throw new Error('No hay sesión de usuario activa');
    }

    // Call both endpoints in parallel
    const ownerRequest = this.api.get<OwnerBusiness[]>(`/api/business/owner/${ownerId}`);
    const employeeRequest = this.businessService.getAsEmployee();

    return forkJoin([ownerRequest, employeeRequest]).pipe(
      map(([ownerBusinesses, employeeBusinesses]) => {
        return this.combineAndDeduplicate(ownerBusinesses, employeeBusinesses);
      }),
      catchError((error) => {
        // If one endpoint fails, try to return just the working one
        console.error('Error fetching businesses:', error);
        // Re-throw the error to let the component handle it
        return throwError(() => error);
      })
    );
  }

  /**
   * Combines and deduplicates businesses from both endpoints
   * Priority: 'owner' when a business appears in both lists
   */
  private combineAndDeduplicate(
    ownerBusinesses: OwnerBusiness[],
    employeeBusinesses: BusinessListItem[]
  ): OwnerBusiness[] {
    // Transform employee businesses to OwnerBusiness format with 'employee' type
    const employeeBusinessesTransformed: OwnerBusiness[] = employeeBusinesses.map(
      (item): OwnerBusiness => ({
        id: item.id,
        name: item.name,
        category: item.category,
        address: item.address,
        city: item.city,
        department: '',
        averageRating: item.averageRating,
        totalReviews: item.totalReviews,
        isActive: item.isActive,
        createdAt: '',
        ownerId: '',
        ownerName: '',
        images: item.imageBase64
          ? [
              {
                id: '',
                imagePath: '',
                imageBase64: item.imageBase64,
                createdAt: '',
              },
            ]
          : undefined,
        relationshipType: 'employee',
      })
    );

    // Combine both lists
    const allBusinesses: OwnerBusiness[] = [
      ...ownerBusinesses.map((b) => ({ ...b, relationshipType: 'owner' as const })),
      ...employeeBusinessesTransformed,
    ];

    // Deduplicate by business ID, keeping 'owner' priority
    const seen = new Map<string, OwnerBusiness>();
    for (const business of allBusinesses) {
      const existing = seen.get(business.id);
      if (!existing) {
        seen.set(business.id, business);
      } else {
        // If existing is 'owner' or current is 'owner', keep 'owner'
        if (business.relationshipType === 'owner') {
          seen.set(business.id, business);
        }
      }
    }

    return Array.from(seen.values());
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
   * Create a new business (images optional)
   */
  createWithFormData(business: CreateBusinessRequest, images: File[] = []): Observable<OwnerBusiness> {
    const formData = new FormData();
    Object.entries(business).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
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
   * Legacy create method (sin imágenes) - ahora redirige a createWithFormData
   */
  create(business: CreateBusinessRequest): Observable<OwnerBusiness> {
    return this.createWithFormData(business, []);
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

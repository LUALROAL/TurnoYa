import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import {
  OwnerBusiness,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  BusinessSettings,
} from '../models';

/**
 * Service for managing business ownership operations
 */
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
   * Create a new business (OwnerId extracted from JWT in backend)
   */
  create(business: CreateBusinessRequest): Observable<OwnerBusiness> {
    return this.api.post<OwnerBusiness>('/api/business', business);
  }

  /**
   * Update an existing business (ownership verified in backend)
   */
  update(
    id: string,
    business: UpdateBusinessRequest
  ): Observable<OwnerBusiness> {
    return this.api.put<OwnerBusiness>(`/api/business/${id}`, business);
  }

  /**
   * Delete a business (ownership verified in backend)
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/business/${id}`);
  }

  /**
   * Toggle business active status
   */
  toggleActive(id: string, isActive: boolean): Observable<OwnerBusiness> {
    return this.update(id, { isActive });
  }

  /**
   * Get business settings/configuration
   */
  getSettings(businessId: string): Observable<BusinessSettings> {
    return this.api.get<BusinessSettings>(`/api/business/${businessId}/settings`);
  }

  /**
   * Update business settings/configuration (ownership verified in backend)
   */
  updateSettings(
    businessId: string,
    settings: BusinessSettings
  ): Observable<BusinessSettings> {
    return this.api.put<BusinessSettings>(`/api/business/${businessId}/settings`, settings);
  }
}

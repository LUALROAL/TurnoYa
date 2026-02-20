import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  UserManageDto,
  PagedUsersResponseDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
} from '../models/admin-users.models';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Busca y lista usuarios con filtros y paginación
   * @param searchTerm Término de búsqueda (email, firstName, lastName)
   * @param role Filtrar por rol (Customer, Owner, Admin)
   * @param page Número de página (base 1)
   * @param pageSize Cantidad de elementos por página
   */
  searchUsers(
    searchTerm?: string,
    role?: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<PagedUsersResponseDto> {
    let params = new HttpParams();

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (role) {
      params = params.set('role', role);
    }
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());

    return this.http.get<PagedUsersResponseDto>(`${this.apiUrl}/users`, { params });
  }

  /**
   * Obtiene los detalles de un usuario específico
   * @param userId ID del usuario
   */
  getUser(userId: string): Observable<UserManageDto> {
    return this.http.get<UserManageDto>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Actualiza el estado (bloqueo) de un usuario
   * @param userId ID del usuario
   * @param statusData Datos de actualización de estado
   */
  updateUserStatus(userId: string, statusData: UpdateUserStatusDto): Observable<UserManageDto> {
    return this.http.patch<UserManageDto>(
      `${this.apiUrl}/users/${userId}/status`,
      statusData
    );
  }

  /**
   * Actualiza el rol de un usuario
   * @param userId ID del usuario
   * @param roleData Datos de actualización de rol
   */
  updateUserRole(userId: string, roleData: UpdateUserRoleDto): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/users/${userId}/role`,
      roleData
    );
  }
}


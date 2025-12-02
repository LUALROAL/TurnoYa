import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Business,
  CreateBusinessDto,
  UpdateBusinessDto,
  Category,
  ApiResponse,
  PaginatedResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private apiUrl = `${environment.apiUrl}/Business`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los negocios (con paginación y filtros)
   */
  getBusinesses(
    pageNumber: number = 1,
    pageSize: number = 10,
    search?: string,
    categoryId?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Obtener un negocio por ID
   */
  getBusinessById(id: string): Observable<ApiResponse<Business>> {
    return this.http.get<ApiResponse<Business>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo negocio
   */
  createBusiness(data: CreateBusinessDto): Observable<ApiResponse<Business>> {
    return this.http.post<ApiResponse<Business>>(this.apiUrl, data);
  }

  /**
   * Actualizar negocio existente
   */
  updateBusiness(id: string, data: UpdateBusinessDto): Observable<ApiResponse<Business>> {
    return this.http.put<ApiResponse<Business>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Eliminar negocio
   */
  deleteBusiness(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener negocios del propietario actual
   */
  getMyBusinesses(): Observable<ApiResponse<Business[]>> {
    return this.http.get<ApiResponse<Business[]>>(`${this.apiUrl}/my-businesses`);
  }

  /**
   * Obtener categorías disponibles
   */
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`);
  }

  /**
   * Buscar negocios por ubicación (futuro: geolocalización)
   */
  searchByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Observable<ApiResponse<Business[]>> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radiusKm', radiusKm.toString());

    return this.http.get<ApiResponse<Business[]>>(`${this.apiUrl}/nearby`, { params });
  }
}

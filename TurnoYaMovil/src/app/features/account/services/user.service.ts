import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChangePasswordDto, UpdateUserProfileDto, UserProfileDto } from '../models/user-profile.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el perfil del usuario autenticado
   */
  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.apiUrl}/me`);
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(data: UpdateUserProfileDto): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.apiUrl}/me`, data);
  }

  /**
   * Cambia la contraseña del usuario
   */
  changePassword(data: ChangePasswordDto): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, data);
  }

  updateProfileWithPhoto(data: UpdateUserProfileDto, photo?: File): Observable<UserProfileDto> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });
  if (photo) {
    formData.append('photo', photo, photo.name);
  }
  return this.http.put<UserProfileDto>(`${this.apiUrl}/me`, formData);
}
}

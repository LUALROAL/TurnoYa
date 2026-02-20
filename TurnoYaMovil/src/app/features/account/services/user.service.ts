import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  phone?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  averageRating: number;
  completedAppointments: number;
  createdAt: string;
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

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
}

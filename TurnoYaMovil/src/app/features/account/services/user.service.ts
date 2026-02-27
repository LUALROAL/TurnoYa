import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChangePasswordDto, UpdateUserProfileDto, UserProfileDto } from '../models/user-profile.model';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(private http: HttpClient, private authSession: AuthSessionService) {}

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

 /**
   * Obtiene el perfil actualizado, actualiza la sesión local y emite el evento global.
   */
  refreshUserProfile(): Observable<UserProfileDto> {
    return this.getProfile().pipe(
      tap(profile => {
        const session = this.authSession.getSession();
        if (session) {
          // Actualiza los datos del usuario en la sesión (especialmente el rol)
          session.user = {
            ...session.user,
            ...profile,
            role: profile.role, // asegura que el rol se actualice
          };
          this.authSession.setSession(session); // esto emite el nuevo valor a través de session$
        }
        // Dispara evento global por si algún componente aún lo usa
        window.dispatchEvent(new CustomEvent('refreshUserProfile'));
      })
    );
  }
}

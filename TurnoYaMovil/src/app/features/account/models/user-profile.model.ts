export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  phone?: string;
  photoUrl?: string;
  photoBase64?: string;  // 👈 AGREGAR ESTA LÍNEA
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

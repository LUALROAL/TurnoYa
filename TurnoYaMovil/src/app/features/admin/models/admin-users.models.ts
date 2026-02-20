/**
 * Modelos e Interfaces para el módulo de Administración
 */

/**
 * DTO para representar un usuario en la sección de administración
 */
export interface UserManageDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  profilePictureUrl?: string;
  isEmailVerified: boolean;
  isBlocked: boolean;
  blockReason?: string;
  blockUntil?: string;
  lastLoginAt?: string;
  createdAt: string;
}

/**
 * DTO para actualizar el estado (bloqueo) de un usuario
 */
export interface UpdateUserStatusDto {
  isBlocked: boolean;
  blockReason?: string;
  blockUntil?: string;
}

/**
 * DTO para actualizar el rol de un usuario
 */
export interface UpdateUserRoleDto {
  role: string;
}

/**
 * DTO para respuesta paginada de usuarios
 */
export interface PagedUsersResponseDto {
  users: UserManageDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

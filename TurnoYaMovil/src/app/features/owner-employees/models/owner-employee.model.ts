export interface OwnerEmployee {
  id: string;
  businessId: string;
  userId?: string; // Para determinar isLinked
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  email?: string;
  position?: string;
  bio?: string;
  profilePictureUrl?: string;
  photoBase64?: string; // Nueva propiedad
  serviceIds: string[];
  isActive: boolean;
  isLinked?: boolean; // Campo calculado desde el backend
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  position?: string;
  bio?: string;
  profilePictureUrl?: string;
  photoBase64?: string; // Opcional, si se envía desde el frontend
  serviceIds: string[];
  isActive?: boolean;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  position?: string;
  bio?: string;
  profilePictureUrl?: string;
  photoBase64?: string;
  serviceIds?: string[];
  isActive?: boolean;
}

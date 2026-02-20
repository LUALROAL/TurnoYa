export interface OwnerEmployee {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  email?: string;
  position?: string;
  bio?: string;
  profilePictureUrl?: string;
  isActive: boolean;
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
  isActive?: boolean;
}

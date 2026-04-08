/**
 * Business model for owner management
 * Matches BusinessDto from backend
 */
export interface OwnerBusiness {
  id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  city: string;
  department: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  images?: BusinessImage[];
  /** Tipo de relación del usuario con el negocio: 'owner' (dueño) o 'employee' (empleado) */
  relationshipType?: 'owner' | 'employee';
}

/**
 * Business image model
 */
export interface BusinessImage {
  id: string;
  imagePath: string;
  imageBase64?: string;
  createdAt: string;
}

/**
 * DTO for creating a new business
 * Matches CreateBusinessDto from backend
 */
export interface CreateBusinessRequest {
  name: string;
  description?: string;
  category: string;
  address: string;
  city: string;
  department: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * DTO for updating business
 * Matches UpdateBusinessDto from backend
 */
export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  department?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}


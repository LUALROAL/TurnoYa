export interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;  // String simple, no objeto
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
}

export interface BusinessDetail extends Business {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  services: Service[];
  employees: Employee[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  duration: number;  // minutos
  price: number;
  currency: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// DTOs para crear/actualizar
export interface CreateBusinessDto {
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

export interface UpdateBusinessDto {
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

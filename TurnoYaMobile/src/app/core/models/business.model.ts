export interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rating?: number;
  totalReviews?: number;
  ownerId: string;
  categoryId: string;
  category?: Category;
  workingHours?: WorkingHours;
  services?: Service[];
  createdAt?: string;
  updatedAt?: string;
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

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;  // "09:00"
  closeTime: string; // "18:00"
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  categoryId: string;
  workingHours?: WorkingHours;
}

export interface UpdateBusinessDto {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  categoryId?: string;
  workingHours?: WorkingHours;
}

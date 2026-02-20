export interface BusinessOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  profilePictureUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface BusinessServiceItem {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  requiresDeposit: boolean;
  depositAmount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessEmployeeItem {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string;
  city: string;
  department: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  owner: BusinessOwner;
  services: BusinessServiceItem[];
  employees: BusinessEmployeeItem[];
}

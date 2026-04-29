export interface BusinessListItem {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  distance: number | null;
  imageBase64?: string;
  isVerified?: boolean;
  // Permisos del empleado para este negocio
  permissions?: Record<string, boolean>;
}

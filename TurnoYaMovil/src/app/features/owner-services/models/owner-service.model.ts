export interface OwnerService {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  requiresDeposit: boolean;
  depositAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  duration: number;
  requiresDeposit: boolean;
  depositAmount?: number;
  isActive?: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  requiresDeposit?: boolean;
  depositAmount?: number;
  isActive?: boolean;
}

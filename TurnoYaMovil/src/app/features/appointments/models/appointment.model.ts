export interface CreateAppointmentRequest {
  businessId: string;
  serviceId: string;
  employeeId?: string;
  scheduledDate: string;
  notes?: string;
}

export interface AppointmentItem {
  id: string;
  referenceNumber: string;
  userId: string;
  businessId: string;
  serviceId: string;
  employeeId?: string;
  scheduledDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  notes?: string;
}

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
  businessName?: string;
  serviceId: string;
  serviceName: string;
  employeeId?: string;
  employeeName?: string;
  scheduledDate: string;
  endDate: string;
  status: string | number;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  notes?: string;
}

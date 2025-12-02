import { Business, Service } from './business.model';
import { User } from './user.model';

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  employeeId?: string;
  userId: string;
  startDate: string;  // ISO 8601
  endDate: string;
  status: AppointmentStatus;
  notes?: string;
  reference: string;
  paymentStatus?: PaymentStatus;
  business?: Business;
  service?: Service;
  employee?: Employee;
  user?: User;
  createdAt?: string;
  updatedAt?: string;
}

export enum AppointmentStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded'
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  businessId: string;
}

export interface CreateAppointmentDto {
  businessId: string;
  serviceId: string;
  employeeId?: string;
  startDate: string;
  notes?: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AvailabilityRequest {
  businessId: string;
  serviceId: string;
  date: string;
  employeeId?: string;
}

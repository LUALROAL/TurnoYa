export interface PaymentIntent {
  appointmentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: string;
  transactionId?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  redirectUrl?: string;
}

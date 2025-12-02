export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  profilePictureUrl?: string;
}

export enum UserRole {
  Customer = 'Customer',
  BusinessOwner = 'BusinessOwner',
  Employee = 'Employee',
  Admin = 'Admin'
}

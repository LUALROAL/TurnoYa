export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "Customer" | "BusinessOwner";
}

export interface RefreshTokenRequestDto {
  token: string;
  refreshToken: string;
}

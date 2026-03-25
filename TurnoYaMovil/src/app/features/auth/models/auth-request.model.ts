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

export interface GoogleLoginRequestDto {
  idToken: string;
  fullName?: string;
  givenName?: string;
  familyName?: string;
  imageUrl?: string;
}

export interface LinkGoogleRequestDto {
  idToken: string;
}

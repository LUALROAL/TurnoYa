import { AuthUser } from "./auth-user.model";

export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

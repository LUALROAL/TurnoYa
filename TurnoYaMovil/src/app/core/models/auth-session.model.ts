import { AuthUser } from "../../features/auth/models";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: AuthUser;
}

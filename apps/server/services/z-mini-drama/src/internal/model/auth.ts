export interface AuthenticatedUser {
  id: number;
  username: string;
  role: string;
}

export interface AccessTokenClaims {
  user_id: number;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  nickname: string;
}

export interface LoginResponse {
  token: string;
  token_expire_at: number;
  user: AuthenticatedUser & {
    nickname: string;
  };
}

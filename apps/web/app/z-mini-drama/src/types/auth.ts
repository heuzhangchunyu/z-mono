export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  nickname: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: number;
  username: string;
  nickname: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  token_expire_at: number;
  user: AuthUser;
}

export interface CurrentUser extends AuthUser {
  created_at: string;
}

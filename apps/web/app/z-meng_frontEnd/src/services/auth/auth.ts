import request from '../../lib/request/request';
import type { AuthMode } from '../../types/auth';

interface AuthPayload {
  username: string;
  password: string;
}

interface AuthResponse {
  message?: string;
}

const authPathMap: Record<AuthMode, string> = {
  login: '/auth/login',
  register: '/auth/register'
};

export async function submitAuth(mode: AuthMode, payload: AuthPayload) {
  const response = await request.post<AuthResponse>(authPathMap[mode], payload);
  return response.data;
}

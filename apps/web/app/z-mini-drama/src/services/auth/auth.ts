import request from '@/lib/request/request';
import type { AuthUser, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';

const ACCESS_TOKEN_STORAGE_KEY = 'z-mini-drama.access-token';
const CURRENT_USER_STORAGE_KEY = 'z-mini-drama.current-user';

export async function loginWithPassword(payload: LoginPayload) {
  const response = await request.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function registerWithPassword(payload: Omit<RegisterPayload, 'confirmPassword'>) {
  const response = await request.post<LoginResponse>('/auth/register', payload);
  return response.data;
}

export function persistAuthSession(payload: LoginResponse) {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.token);
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(payload.user));
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function readStoredUser() {
  const rawValue = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function updateStoredUser(user: AuthUser) {
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

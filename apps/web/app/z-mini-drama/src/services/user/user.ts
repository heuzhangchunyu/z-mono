import request from '@/lib/request/request';
import type { CurrentUser } from '@/types/auth';

export async function fetchCurrentUser() {
  const response = await request.get<CurrentUser>('/user/current');
  return response.data;
}

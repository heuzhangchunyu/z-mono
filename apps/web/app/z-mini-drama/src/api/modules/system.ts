import request, { type ApiResponse } from '@/api/setup';
import type { HealthStatus } from '@/types/system';

export async function fetchHealthStatus() {
  const response = await request.get<ApiResponse<HealthStatus>>('/health');
  return response.data.data;
}

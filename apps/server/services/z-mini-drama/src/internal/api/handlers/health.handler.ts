import type { ApiSuccessResponse } from '../../model/http.js';
import type { HealthStatus } from '../../model/health.js';
import type { HealthService } from '../../service/health.service.js';

export function getHealth(healthService: HealthService): ApiSuccessResponse<HealthStatus> {
  return {
    code: 0,
    message: 'ok',
    data: healthService.getStatus()
  };
}

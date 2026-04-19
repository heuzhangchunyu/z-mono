export interface HealthStatus {
  serviceName: string;
  status: 'ok' | 'degraded' | 'error';
  version: string;
  timestamp: string;
}

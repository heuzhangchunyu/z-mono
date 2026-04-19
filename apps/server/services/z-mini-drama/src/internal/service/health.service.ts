import type { AppConfig } from '../config/env.js';
import type { HealthStatus } from '../model/health.js';

export class HealthService {
  constructor(private readonly appConfig: AppConfig) {}

  getStatus(): HealthStatus {
    return {
      serviceName: this.appConfig.serviceName,
      status: 'ok',
      version: this.appConfig.version,
      timestamp: new Date().toISOString(),
      database: {
        provider: 'postgresql',
        status: 'connected',
        host: this.appConfig.database.host,
        port: this.appConfig.database.port,
        database: this.appConfig.database.name
      }
    };
  }
}

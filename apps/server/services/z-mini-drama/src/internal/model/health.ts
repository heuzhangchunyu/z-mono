export interface HealthStatus {
  serviceName: string;
  status: 'ok';
  version: string;
  timestamp: string;
  database: DatabaseHealthStatus;
}

export interface DatabaseHealthStatus {
  provider: 'postgresql';
  status: 'connected';
  host: string;
  port: number;
  database: string;
}

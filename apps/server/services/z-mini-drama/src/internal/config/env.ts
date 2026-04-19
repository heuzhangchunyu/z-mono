export interface AppConfig {
  port: number;
  corsOrigin: string;
  serviceName: string;
  version: string;
}

function readNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

export function loadAppConfig(): AppConfig {
  return {
    port: readNumberEnv('PORT', 4102),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    serviceName: process.env.SERVICE_NAME ?? 'z-mini-drama-backend',
    version: process.env.SERVICE_VERSION ?? '0.1.0'
  };
}

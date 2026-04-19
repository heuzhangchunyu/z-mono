export interface AppConfig {
  port: number;
  corsOrigin: string;
  serviceName: string;
  version: string;
  database: DatabaseConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
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
    version: process.env.SERVICE_VERSION ?? '0.1.0',
    database: {
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: readNumberEnv('DB_PORT', 5432),
      name: process.env.DB_NAME ?? 'zmini_drama',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      ssl: process.env.DB_SSL === 'true'
    }
  };
}

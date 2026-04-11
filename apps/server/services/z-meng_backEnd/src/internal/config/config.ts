import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import YAML from 'yaml';

export interface ServerConfig {
  host: string;
  port: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
  sslMode: string;
}

export interface RuntimeConfig {
  enableHttp: boolean;
  migrationTarget: string;
}

export interface AIConfig {
  provider: 'dashscope';
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface Config {
  env: string;
  appName: string;
  server: ServerConfig;
  database: DatabaseConfig;
  runtime: RuntimeConfig;
  ai: AIConfig;
}

interface RawConfig {
  env?: string;
  app_name?: string;
  server?: {
    host?: string;
    port?: number;
  };
  database?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    db_name?: string;
    ssl_mode?: string;
  };
  runtime?: {
    enable_http?: boolean;
    migration_target?: string;
  };
  ai?: {
    provider?: 'dashscope';
    base_url?: string;
    model?: string;
    api_key?: string;
  };
}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const serviceRoot = path.resolve(moduleDir, '../../..');

export function loadConfig(configPath?: string): Config {
  const resolvedPath = resolveConfigPath(configPath);
  const fileContent = fs.readFileSync(resolvedPath, 'utf8');
  const raw = (YAML.parse(fileContent) ?? {}) as RawConfig;

  const config: Config = {
    env: raw.env ?? 'development',
    appName: raw.app_name ?? 'z-meng-backend',
    server: {
      host: raw.server?.host ?? '127.0.0.1',
      port: raw.server?.port ?? 4101
    },
    database: {
      host: raw.database?.host ?? '127.0.0.1',
      port: raw.database?.port ?? 5432,
      user: raw.database?.user ?? 'postgres',
      password: raw.database?.password ?? 'postgres',
      dbName: raw.database?.db_name ?? 'z_meng',
      sslMode: raw.database?.ssl_mode ?? 'disable'
    },
    runtime: {
      enableHttp: raw.runtime?.enable_http ?? true,
      migrationTarget: raw.runtime?.migration_target ?? 'autoup'
    },
    ai: {
      provider: raw.ai?.provider ?? 'dashscope',
      baseUrl: raw.ai?.base_url ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: raw.ai?.model ?? 'qwen-plus',
      apiKey: raw.ai?.api_key ?? ''
    }
  };

  return applyEnvOverrides(config);
}

export function buildPostgresConnectionString(database: DatabaseConfig): string {
  return `postgres://${database.user}:${database.password}@${database.host}:${database.port}/${database.dbName}?sslmode=${database.sslMode}`;
}

function resolveConfigPath(configPath?: string): string {
  if (configPath) {
    return path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
  }

  const candidates = [
    path.join(serviceRoot, 'config', 'config.yaml'),
    path.join(process.cwd(), 'config', 'config.yaml')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to find config.yaml. Checked: ${candidates.join(', ')}`);
}

function applyEnvOverrides(config: Config): Config {
  return {
    env: process.env.NODE_ENV ?? config.env,
    appName: process.env.APP_NAME ?? config.appName,
    server: {
      host: process.env.SERVER_HOST ?? config.server.host,
      port: parseNumber(process.env.PORT ?? process.env.SERVER_PORT, config.server.port)
    },
    database: {
      host: process.env.POSTGRES_HOST ?? config.database.host,
      port: parseNumber(process.env.POSTGRES_PORT, config.database.port),
      user: process.env.POSTGRES_USER ?? config.database.user,
      password: process.env.POSTGRES_PASSWORD ?? config.database.password,
      dbName: process.env.POSTGRES_DB ?? config.database.dbName,
      sslMode: process.env.POSTGRES_SSLMODE ?? config.database.sslMode
    },
    runtime: {
      enableHttp: parseBoolean(process.env.ENABLE_HTTP, config.runtime.enableHttp),
      migrationTarget: process.env.MIGRATION_TARGET ?? config.runtime.migrationTarget
    },
    ai: {
      provider: 'dashscope',
      baseUrl: process.env.DASHSCOPE_BASE_URL ?? config.ai.baseUrl,
      model: process.env.DASHSCOPE_MODEL ?? config.ai.model,
      apiKey: process.env.DASHSCOPE_API_KEY ?? config.ai.apiKey
    }
  };
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

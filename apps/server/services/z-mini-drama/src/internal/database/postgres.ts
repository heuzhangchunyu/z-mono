import { Pool } from 'pg';
import type { DatabaseConfig } from '../config/env.js';

export function createPostgresPool(databaseConfig: DatabaseConfig) {
  return new Pool({
    host: databaseConfig.host,
    port: databaseConfig.port,
    database: databaseConfig.name,
    user: databaseConfig.user,
    password: databaseConfig.password,
    ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
}

export async function pingPostgres(pool: Pool) {
  await pool.query('select 1');
}

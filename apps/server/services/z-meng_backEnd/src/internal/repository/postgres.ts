import { Pool } from 'pg';

import type { DatabaseConfig } from '../config/config.js';

export function createDatabasePool(config: DatabaseConfig): Pool {
  return new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.dbName,
    ssl: config.sslMode === 'require' ? { rejectUnauthorized: false } : false
  });
}

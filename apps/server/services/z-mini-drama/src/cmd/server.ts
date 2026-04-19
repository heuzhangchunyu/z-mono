import type { Pool } from 'pg';
import { createServerApp } from '../internal/api/app.js';
import { loadAppConfig } from '../internal/config/env.js';
import { Migrate } from '../internal/data/data.js';
import { createPostgresPool, pingPostgres } from '../internal/database/postgres.js';

const appConfig = loadAppConfig();
await Migrate(buildPostgresConnectionString(appConfig.database), 'autoup');

const postgresPool = createPostgresPool(appConfig.database);

await pingPostgres(postgresPool);

const app = createServerApp(appConfig, postgresPool);

app.listen(appConfig.port, () => {
  console.log(`z-mini-drama backend listening on http://127.0.0.1:${appConfig.port}`);
});

attachShutdown(postgresPool);

function attachShutdown(pool: Pool) {
  const shutdown = async () => {
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });

  process.on('SIGTERM', () => {
    void shutdown();
  });
}

function buildPostgresConnectionString(databaseConfig: typeof appConfig.database) {
  return `postgres://${databaseConfig.user}:${databaseConfig.password}` +
    `@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.name}` +
    `?sslmode=${databaseConfig.ssl ? 'require' : 'disable'}`;
}

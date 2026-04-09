import Koa from 'koa';
import Router from 'koa-router';
import type { Pool } from 'pg';

import { handleLogin } from './internal/auth/login.js';
import { handleRegister } from './internal/auth/register.js';
import { buildPostgresConnectionString, loadConfig } from './internal/config/config.js';
import { migrate } from './internal/data/data.js';
import { handleCreateEpisode } from './internal/episode/createEpisode.js';
import { handleListEpisodes } from './internal/episode/listEpisodes.js';
import { EpisodeRepository } from './internal/repository/episode.js';
import { createDatabasePool } from './internal/repository/postgres.js';
import { UserRepository } from './internal/repository/user.js';

patchKoaUse();

async function main(): Promise<void> {
  const configPath = parseConfigPath(process.argv.slice(2));
  const config = loadConfig(configPath);
  const connectionString = buildPostgresConnectionString(config.database);

  await migrate(connectionString, config.runtime.migrationTarget);

  const database = createDatabasePool(config.database);
  await database.query('SELECT 1');
  const userRepository = new UserRepository(database);
  const episodeRepository = new EpisodeRepository(database);

  const app = new Koa();
  app.use(createCorsMiddleware());

  app.use(createErrorMiddleware());
  const router = createRouter(database, userRepository, episodeRepository, config.database.host, config.database.dbName);
  app.use(router.routes());
  app.use(router.allowedMethods());

  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(`z-meng backend listening on http://${config.server.host}:${config.server.port}`);
  });

  const shutdown = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await database.end();
  };

  process.on('SIGINT', () => {
    shutdown()
      .finally(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    shutdown()
      .finally(() => process.exit(0));
  });
}

function patchKoaUse(): void {
  const prototype = (Koa as unknown as {
    prototype: {
      middleware?: Koa.Middleware[];
      use?: (middleware: Koa.Middleware) => Koa;
    };
  }).prototype as {
    middleware?: Koa.Middleware[];
    use?: (middleware: Koa.Middleware) => Koa;
  };

  prototype.use = function patchedUse(this: Koa & { middleware: Koa.Middleware[] }, middleware: Koa.Middleware): Koa {
    if (typeof middleware !== 'function') {
      throw new TypeError('middleware must be a function!');
    }

    this.middleware.push(middleware);
    return this;
  };
}

function createCorsMiddleware(): Koa.Middleware {
  return async (ctx, next) => {
    const origin = ctx.get('Origin');
    if (origin) {
      ctx.set('Access-Control-Allow-Origin', origin);
      ctx.append('Vary', 'Origin');
    }
    ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    ctx.set('Access-Control-Allow-Credentials', 'true');

    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }

    await next();
  };
}

function createErrorMiddleware(): Koa.Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500;
      const message = error instanceof Error ? error.message : 'Internal server error.';

      ctx.status = status;
      ctx.body = {
        message
      };

      if (status >= 500) {
        console.error('Request failed.', error);
      }
    }
  };
}

function createRouter(
  database: Pool,
  userRepository: UserRepository,
  episodeRepository: EpisodeRepository,
  databaseHost: string,
  databaseName: string
): Router {
  const router = new Router();

  router.get('/health', async (ctx) => {
    await database.query('SELECT 1');
    ctx.body = {
      status: 'ok'
    };
  });

  router.post('/auth/register', async (ctx) => {
    await handleRegister(ctx, userRepository);
  });

  router.post('/auth/login', async (ctx) => {
    await handleLogin(ctx, userRepository);
  });

  router.post('/episodes', async (ctx) => {
    await handleCreateEpisode(ctx, episodeRepository, userRepository);
  });

  router.get('/episodes', async (ctx) => {
    await handleListEpisodes(ctx, episodeRepository, userRepository);
  });

  router.get('/', (ctx) => {
    ctx.body = {
      service: 'z-meng-backend',
      message: 'z-meng AI comic drama service is running.',
      database: {
        host: databaseHost,
        name: databaseName
      },
      modules: ['script', 'storyboard', 'asset-generation', 'voice-sync']
    };
  });

  return router;
}

function parseConfigPath(args: string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--config') {
      return args[index + 1];
    }
  }
  return undefined;
}

main().catch((error: unknown) => {
  console.error('Failed to start z-meng backend.', error);
  process.exit(1);
});

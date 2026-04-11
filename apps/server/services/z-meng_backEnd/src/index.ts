import Koa from 'koa';

import { createTextGenerationProvider } from './internal/ai/factory.js';
import { buildPostgresConnectionString, loadConfig } from './internal/config/config.js';
import { migrate } from './internal/data/data.js';
import { createCorsMiddleware, createErrorMiddleware } from './internal/http/middleware.js';
import { createRouter } from './internal/http/router.js';
import { EpisodeRepository } from './internal/repository/episode.js';
import { LLMCallLogRepository } from './internal/repository/llmCallLog.js';
import { createDatabasePool } from './internal/repository/postgres.js';
import { PromptTemplateRepository } from './internal/repository/promptTemplate.js';
import { UserRepository } from './internal/repository/user.js';
import { AIChatService } from './internal/service/aiChatService.js';
import { AuthService } from './internal/service/authService.js';
import { EpisodeService } from './internal/service/episodeService.js';
import { LLMCallLogService } from './internal/service/llmCallLogService.js';
import { PromptTemplateService } from './internal/service/promptTemplateService.js';

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
  const promptTemplateRepository = new PromptTemplateRepository(database);
  const llmCallLogRepository = new LLMCallLogRepository(database);

  const authService = new AuthService(userRepository);
  const episodeService = new EpisodeService(episodeRepository);
  const promptTemplateService = new PromptTemplateService(promptTemplateRepository);
  const llmCallLogService = new LLMCallLogService(llmCallLogRepository);
  const aiChatService = new AIChatService(
    createTextGenerationProvider(config.ai),
    promptTemplateService,
    llmCallLogService
  );

  const app = new Koa();
  app.use(createCorsMiddleware());
  app.use(createErrorMiddleware());
  const router = createRouter({
    database,
    authService,
    episodeService,
    aiChatService,
    databaseHost: config.database.host,
    databaseName: config.database.dbName
  });
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

import Koa from 'koa';

import type { AppDependencies } from '../bootstrap/dependencies.js';
import type { Config } from '../config/config.js';
import { createCorsMiddleware, createErrorMiddleware } from './middleware.js';
import { ensureKoaUsePatched } from './koaCompat.js';
import { createAIRouter } from './routes/ai.js';
import { createAuthRouter } from './routes/auth.js';
import { createEpisodesRouter } from './routes/episodes.js';
import { createSystemRouter } from './routes/system.js';
import { createRouter } from './router.js';

interface CreateAppInput {
  config: Config;
  dependencies: AppDependencies;
}

export function createApp(input: CreateAppInput): Koa {
  ensureKoaUsePatched();

  const app = new Koa();
  app.use(createCorsMiddleware());
  app.use(createErrorMiddleware());

  const systemRouter = createSystemRouter({
    database: input.dependencies.database,
    databaseHost: input.config.database.host,
    databaseName: input.config.database.dbName
  });
  const authRouter = createAuthRouter({
    authService: input.dependencies.authService
  });
  const episodesRouter = createEpisodesRouter({
    authService: input.dependencies.authService,
    episodeService: input.dependencies.episodeService,
    episodeSubjectService: input.dependencies.episodeSubjectService
  });
  const aiRouter = createAIRouter({
    authService: input.dependencies.authService,
    aiChatService: input.dependencies.aiChatService
  });
  const router = createRouter({
    systemRouter,
    authRouter,
    episodesRouter,
    aiRouter
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

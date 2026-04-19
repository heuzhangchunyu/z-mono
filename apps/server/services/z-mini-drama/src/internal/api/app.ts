import Koa from 'koa';
import cors from '@koa/cors';
import { attachErrorHandler } from './middleware/error-handler.js';
import { createRouter } from './router.js';
import type { AppConfig } from '../config/env.js';
import type { Pool } from 'pg';

export function createServerApp(appConfig: AppConfig, postgresPool: Pool) {
  const app = new Koa();
  app.proxy = true;

  attachErrorHandler(app);
  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization']
    })
  );

  const router = createRouter(appConfig, postgresPool);
  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (ctx) => {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message: `Route not found: ${ctx.method} ${ctx.path}`
    };
  });

  return app;
}

import type Koa from 'koa';
import { getHealth } from './handlers/health.handler.js';
import { HealthService } from '../service/health.service.js';
import type { AppConfig } from '../config/env.js';

export function registerRoutes(app: Koa, appConfig: AppConfig) {
  const healthService = new HealthService(appConfig);

  app.use(async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.path === '/api/health') {
      ctx.body = getHealth(healthService);
      return;
    }

    await next();
  });

  app.use(async (ctx) => {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message: `Route not found: ${ctx.method} ${ctx.path}`
    };
  });
}

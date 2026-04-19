import Koa from 'koa';
import cors from '@koa/cors';
import { attachErrorHandler } from './middleware/error-handler.js';
import { registerRoutes } from './router.js';
import type { AppConfig } from '../config/env.js';

export function createServerApp(appConfig: AppConfig) {
  const app = new Koa();

  attachErrorHandler(app);
  app.use(
    cors({
      origin: appConfig.corsOrigin
    })
  );

  registerRoutes(app, appConfig);

  return app;
}

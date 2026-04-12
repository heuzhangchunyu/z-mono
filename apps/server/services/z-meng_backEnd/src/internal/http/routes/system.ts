import Router from 'koa-router';
import type { Pool } from 'pg';

interface CreateSystemRouterInput {
  database: Pool;
  databaseHost: string;
  databaseName: string;
}

export function createSystemRouter(input: CreateSystemRouterInput): Router {
  const router = new Router();

  router.get('/health', async (ctx) => {
    await input.database.query('SELECT 1');
    ctx.body = {
      status: 'ok'
    };
  });

  router.get('/', (ctx) => {
    ctx.body = {
      service: 'z-meng-backend',
      message: 'z-meng AI comic drama service is running.',
      database: {
        host: input.databaseHost,
        name: input.databaseName
      },
      modules: ['script', 'storyboard', 'asset-generation', 'voice-sync']
    };
  });

  return router;
}

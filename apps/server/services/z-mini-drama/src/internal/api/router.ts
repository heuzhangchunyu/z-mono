import Router from '@koa/router';
import type { Pool } from 'pg';
import { getHealth } from './handlers/health.handler.js';
import { AuthHandler } from './handlers/auth.handler.js';
import { ProjectHandler } from './handlers/project.handler.js';
import { UserHandler } from './handlers/user.handler.js';
import { requireAuth } from './middleware/auth.js';
import { HealthService } from '../service/health.service.js';
import type { AppConfig } from '../config/env.js';
import { ProjectRepository } from '../repository/project.repository.js';
import { UserRepository } from '../repository/user.repository.js';
import { AuthService } from '../service/auth.service.js';

export function createRouter(appConfig: AppConfig, postgresPool: Pool) {
  const healthService = new HealthService(appConfig);
  const userRepository = new UserRepository(postgresPool);
  const projectRepository = new ProjectRepository(postgresPool);
  const authService = new AuthService(appConfig.auth);
  const authHandler = new AuthHandler(userRepository, authService);
  const projectHandler = new ProjectHandler(projectRepository);
  const userHandler = new UserHandler(userRepository);
  const router = new Router({
    prefix: '/api'
  });

  router.get('/health', async (ctx) => {
    ctx.body = getHealth(healthService);
  });

  router.post('/auth/login', async (ctx) => {
    await authHandler.login(ctx);
  });

  router.post('/auth/register', async (ctx) => {
    await authHandler.register(ctx);  
  });

  router.get('/user/current', async (ctx) => {
    await requireAuth(
      ctx,
      async () => {
        await userHandler.getCurrentUser(ctx);
      },
      authService
    );
  });

  router.post('/projects', async (ctx) => {
    await requireAuth(
      ctx,
      async () => {
        await projectHandler.createProject(ctx);
      },
      authService
    );
  });

  router.get('/projects', async (ctx) => {
    await requireAuth(
      ctx,
      async () => {
        await projectHandler.listProjects(ctx);
      },
      authService
    );
  });

  return router;
}

import Router from 'koa-router';

import { createLoginHandler, createRegisterHandler } from '../../handler/auth.js';
import { AuthService } from '../../service/authService.js';

interface CreateAuthRouterInput {
  authService: AuthService;
}

export function createAuthRouter(input: CreateAuthRouterInput): Router {
  const router = new Router({ prefix: '/auth' });

  router.post('/register', createRegisterHandler(input.authService));
  router.post('/login', createLoginHandler(input.authService));

  return router;
}

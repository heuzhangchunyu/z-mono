import Router from 'koa-router';

interface CreateRouterInput {
  systemRouter: Router;
  authRouter: Router;
  episodesRouter: Router;
  aiRouter: Router;
}

export function createRouter(input: CreateRouterInput): Router {
  const router = new Router();

  router.use(input.systemRouter.routes(), input.systemRouter.allowedMethods());
  router.use(input.authRouter.routes(), input.authRouter.allowedMethods());
  router.use(input.episodesRouter.routes(), input.episodesRouter.allowedMethods());
  router.use(input.aiRouter.routes(), input.aiRouter.allowedMethods());

  return router;
}

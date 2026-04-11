import type Koa from 'koa';

export function createCorsMiddleware(): Koa.Middleware {
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

export function createErrorMiddleware(): Koa.Middleware {
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

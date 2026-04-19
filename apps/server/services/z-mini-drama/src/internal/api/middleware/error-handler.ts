import type Koa from 'koa';

export function attachErrorHandler(app: Koa) {
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message
      };

      app.emit('error', error, ctx);
    }
  });

  app.on('error', (error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[z-mini-drama-backend] ${message}`);
  });
}

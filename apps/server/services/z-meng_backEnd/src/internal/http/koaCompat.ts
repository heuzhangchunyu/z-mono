import Koa from 'koa';

let isPatched = false;

export function ensureKoaUsePatched(): void {
  if (isPatched) {
    return;
  }

  const prototype = (Koa as unknown as {
    prototype: {
      middleware?: Koa.Middleware[];
      use?: (middleware: Koa.Middleware) => Koa;
    };
  }).prototype as {
    middleware?: Koa.Middleware[];
    use?: (middleware: Koa.Middleware) => Koa;
  };

  prototype.use = function patchedUse(this: Koa & { middleware: Koa.Middleware[] }, middleware: Koa.Middleware): Koa {
    if (typeof middleware !== 'function') {
      throw new TypeError('middleware must be a function!');
    }

    this.middleware.push(middleware);
    return this;
  };

  isPatched = true;
}

import type Koa from 'koa';

import { readJsonBody } from '../http/body.js';
import { setUserSessionCookie } from '../http/session.js';
import type { LoginPayload, RegisterPayload } from '../model/auth.js';
import { AuthService } from '../service/authService.js';

export function createRegisterHandler(authService: AuthService): Koa.Middleware {
  return async (ctx) => {
    const payload = await readJsonBody<RegisterPayload>(ctx);
    const user = await authService.registerUser(payload);

    ctx.status = 201;
    ctx.body = {
      message: `Account "${user.username}" created successfully.`
    };
  };
}

export function createLoginHandler(authService: AuthService): Koa.Middleware {
  return async (ctx) => {
    const payload = await readJsonBody<LoginPayload>(ctx);
    const user = await authService.loginUser(payload);

    setUserSessionCookie(ctx, user.id);

    ctx.status = 200;
    ctx.body = {
      message: `Welcome back, ${user.username}.`,
      data: {
        userId: user.id,
        username: user.username
      }
    };
  };
}

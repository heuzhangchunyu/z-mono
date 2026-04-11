import type Koa from 'koa';

import { createHttpError } from './body.js';

const USER_ID_COOKIE = 'user_id';

export function setUserSessionCookie(ctx: Koa.Context, userId: number): void {
  ctx.cookies.set(USER_ID_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: 'lax',
    overwrite: true,
    path: '/'
  });
}

export function readAuthenticatedUserId(ctx: Koa.Context): number {
  const userIdRaw = ctx.cookies.get(USER_ID_COOKIE)?.trim() ?? '';

  if (!userIdRaw) {
    throw createHttpError(401, 'user_id cookie is required.');
  }

  const userId = Number(userIdRaw);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createHttpError(401, 'user_id cookie is invalid.');
  }

  return userId;
}

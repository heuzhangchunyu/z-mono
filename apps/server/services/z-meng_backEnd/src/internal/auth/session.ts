import type Koa from 'koa';

import { createHttpError } from '../http/body.js';
import type { UserRecord } from '../repository/user.js';
import { UserRepository } from '../repository/user.js';

const USER_ID_COOKIE = 'user_id';

export function setUserSessionCookie(ctx: Koa.Context, userId: number): void {
  ctx.cookies.set(USER_ID_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: 'lax',
    overwrite: true,
    path: '/'
  });
}

export async function requireAuthenticatedUser(
  ctx: Koa.Context,
  userRepository: UserRepository
): Promise<UserRecord> {
  const userIdRaw = ctx.cookies.get(USER_ID_COOKIE)?.trim() ?? '';

  if (!userIdRaw) {
    throw createHttpError(401, 'user_id cookie is required.');
  }

  const userId = Number(userIdRaw);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createHttpError(401, 'user_id cookie is invalid.');
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw createHttpError(401, 'Invalid user session.');
  }

  if (!user.isActive) {
    throw createHttpError(403, 'This account is disabled.');
  }

  return user;
}

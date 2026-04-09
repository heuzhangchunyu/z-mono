import type Koa from 'koa';

import { verifyPassword } from './password.js';
import { setUserSessionCookie } from './session.js';
import { createBadRequestError, readJsonBody } from '../http/body.js';
import { UserRepository } from '../repository/user.js';

interface LoginPayload {
  username?: string;
  password?: string;
}

export async function handleLogin(ctx: Koa.Context, userRepository: UserRepository): Promise<void> {
  const payload = await readJsonBody<LoginPayload>(ctx);
  const username = payload.username?.trim() ?? '';
  const password = payload.password ?? '';

  if (!username || !password) {
    throw createBadRequestError('Username and password are required.');
  }

  const user = await userRepository.findByUsername(username);
  if (!user) {
    ctx.status = 401;
    ctx.body = {
      message: 'Invalid username or password.'
    };
    return;
  }

  if (!user.isActive) {
    ctx.status = 403;
    ctx.body = {
      message: 'This account is disabled.'
    };
    return;
  }

  const matched = await verifyPassword(password, user.passwordHash);
  if (!matched) {
    ctx.status = 401;
    ctx.body = {
      message: 'Invalid username or password.'
    };
    return;
  }

  setUserSessionCookie(ctx, user.id);

  ctx.status = 200;
  ctx.body = {
    message: `Welcome back, ${user.username}.`,
    data: {
      userId: user.id,
      username: user.username
    }
  };
}

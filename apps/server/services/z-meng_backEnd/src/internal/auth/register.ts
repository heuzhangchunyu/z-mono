import type Koa from 'koa';

import { hashPassword } from './password.js';
import { createBadRequestError, readJsonBody } from '../http/body.js';
import { UserRepository } from '../repository/user.js';

interface RegisterPayload {
  username?: string;
  password?: string;
}

export async function handleRegister(ctx: Koa.Context, userRepository: UserRepository): Promise<void> {
  const payload = await readJsonBody<RegisterPayload>(ctx);
  const username = payload.username?.trim() ?? '';
  const password = payload.password ?? '';

  validateRegisterPayload(username, password);

  const existingUser = await userRepository.findByUsername(username);
  if (existingUser) {
    ctx.status = 409;
    ctx.body = {
      message: `Username "${username}" is already registered.`
    };
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.createUser({
    username,
    passwordHash
  });

  ctx.status = 201;
  ctx.body = {
    message: `Account "${user.username}" created successfully.`
  };
}

function validateRegisterPayload(username: string, password: string): void {
  if (!username) {
    throw createBadRequestError('Username is required.');
  }

  if (username.length < 3 || username.length > 50) {
    throw createBadRequestError('Username must be between 3 and 50 characters.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw createBadRequestError('Username can only contain letters, numbers, underscores, and hyphens.');
  }

  if (!password) {
    throw createBadRequestError('Password is required.');
  }

  if (password.length < 8) {
    throw createBadRequestError('Password must be at least 8 characters long.');
  }
}

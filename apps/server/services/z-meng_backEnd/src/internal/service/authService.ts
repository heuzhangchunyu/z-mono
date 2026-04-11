import { hashPassword, verifyPassword } from '../auth/password.js';
import { createBadRequestError, createHttpError } from '../http/body.js';
import type { LoginPayload, RegisterPayload } from '../model/auth.js';
import type { UserRecord } from '../model/user.js';
import { UserRepository } from '../repository/user.js';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async registerUser(payload: RegisterPayload): Promise<UserRecord> {
    const username = payload.username?.trim() ?? '';
    const password = payload.password ?? '';

    validateRegisterPayload(username, password);

    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      throw createHttpError(409, `Username "${username}" is already registered.`);
    }

    const passwordHash = await hashPassword(password);
    return this.userRepository.createUser({
      username,
      passwordHash
    });
  }

  async loginUser(payload: LoginPayload): Promise<UserRecord> {
    const username = payload.username?.trim() ?? '';
    const password = payload.password ?? '';

    if (!username || !password) {
      throw createBadRequestError('Username and password are required.');
    }

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw createHttpError(401, 'Invalid username or password.');
    }

    if (!user.isActive) {
      throw createHttpError(403, 'This account is disabled.');
    }

    const matched = await verifyPassword(password, user.passwordHash);
    if (!matched) {
      throw createHttpError(401, 'Invalid username or password.');
    }

    return user;
  }

  async requireActiveUser(userId: number): Promise<UserRecord> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createHttpError(401, 'user_id cookie is invalid.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createHttpError(401, 'Invalid user session.');
    }

    if (!user.isActive) {
      throw createHttpError(403, 'This account is disabled.');
    }

    return user;
  }
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

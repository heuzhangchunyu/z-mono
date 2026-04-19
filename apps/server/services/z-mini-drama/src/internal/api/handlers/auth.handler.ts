import type { Context } from 'koa';
import type { DatabaseError } from 'pg';
import type { UserRepository } from '../../repository/user.repository.js';
import type { AuthService } from '../../service/auth.service.js';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../../model/auth.js';

export class AuthHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService
  ) {}

  async login(ctx: Context) {
    const requestBody = await readLoginRequest(ctx);
    if (!requestBody) {
      return;
    }

    const normalizedUsername = this.authService.normalizeUsername(requestBody.username);
    if (!normalizedUsername || !requestBody.password) {
      ctx.status = 400;
      ctx.body = {
        error: '用户名和密码不能为空'
      };
      return;
    }

    const user = await this.userRepository.findByUsername(normalizedUsername);
    if (!user || !user.isActive) {
      ctx.status = 401;
      ctx.body = {
        error: '用户名或密码错误'
      };
      return;
    }

    if (!this.authService.verifyPassword(requestBody.password, user.passwordHash)) {
      ctx.status = 401;
      ctx.body = {
        error: '用户名或密码错误'
      };
      return;
    }

    const tokenResult = await this.authService.createAccessToken(user);
    const responseBody: LoginResponse = {
      token: tokenResult.token,
      token_expire_at: tokenResult.tokenExpireAt,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role
      }
    };

    ctx.body = responseBody;
  }

  async register(ctx: Context) {
    const requestBody = await readRegisterRequest(ctx);
    if (!requestBody) {
      return;
    }

    const normalizedUsername = this.authService.normalizeUsername(requestBody.username);
    const normalizedNickname = this.authService.normalizeNickname(requestBody.nickname, normalizedUsername);

    const validationMessage = validateRegisterPayload({
      username: normalizedUsername,
      nickname: normalizedNickname,
      password: requestBody.password
    });
    if (validationMessage) {
      ctx.status = 400;
      ctx.body = {
        error: validationMessage
      };
      return;
    }

    const existingUser = await this.userRepository.findByUsername(normalizedUsername);
    if (existingUser) {
      ctx.status = 409;
      ctx.body = {
        error: '用户名已存在'
      };
      return;
    }

    try {
      const createdUser = await this.userRepository.createUser({
        username: normalizedUsername,
        nickname: normalizedNickname,
        passwordHash: this.authService.hashPassword(requestBody.password),
        role: 'user',
        isActive: true
      });
      const tokenResult = await this.authService.createAccessToken(createdUser);
      const responseBody: LoginResponse = {
        token: tokenResult.token,
        token_expire_at: tokenResult.tokenExpireAt,
        user: {
          id: createdUser.id,
          username: createdUser.username,
          nickname: createdUser.nickname,
          role: createdUser.role
        }
      };

      ctx.status = 201;
      ctx.body = responseBody;
    } catch (error) {
      if (isUniqueViolation(error)) {
        ctx.status = 409;
        ctx.body = {
          error: '用户名已存在'
        };
        return;
      }

      throw error;
    }
  }
}

async function readLoginRequest(ctx: Context) {
  try {
    const requestBody = await readJsonBody<Partial<LoginRequest>>(ctx);
    return {
      username: typeof requestBody.username === 'string' ? requestBody.username : '',
      password: typeof requestBody.password === 'string' ? requestBody.password : ''
    } satisfies LoginRequest;
  } catch {
    ctx.status = 400;
    ctx.body = {
      error: '请求体必须是合法 JSON'
    };
    return null;
  }
}

async function readRegisterRequest(ctx: Context) {
  try {
    const requestBody = await readJsonBody<Partial<RegisterRequest>>(ctx);
    return {
      username: typeof requestBody.username === 'string' ? requestBody.username : '',
      nickname: typeof requestBody.nickname === 'string' ? requestBody.nickname : '',
      password: typeof requestBody.password === 'string' ? requestBody.password : ''
    } satisfies RegisterRequest;
  } catch {
    ctx.status = 400;
    ctx.body = {
      error: '请求体必须是合法 JSON'
    };
    return null;
  }
}

async function readJsonBody<T>(ctx: Context) {
  const chunks: Buffer[] = [];

  for await (const chunk of ctx.req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function validateRegisterPayload(payload: RegisterRequest) {
  if (!payload.username || !payload.password) {
    return '用户名和密码不能为空';
  }

  if (payload.username.length < 3 || payload.username.length > 24) {
    return '用户名长度需在 3 到 24 个字符之间';
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(payload.username)) {
    return '用户名仅支持字母、数字、下划线和中划线';
  }

  if (payload.password.length < 8 || payload.password.length > 64) {
    return '密码长度需在 8 到 64 个字符之间';
  }

  if (payload.nickname.length > 32) {
    return '昵称长度不能超过 32 个字符';
  }

  return null;
}

function isUniqueViolation(error: unknown): error is DatabaseError {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505';
}

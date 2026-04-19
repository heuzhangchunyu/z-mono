import type { Context, Next } from 'koa';
import type { AuthService } from '../../service/auth.service.js';
import type { AuthenticatedUser } from '../../model/auth.js';

export async function requireAuth(
  ctx: Context,
  next: Next,
  authService: AuthService
) {
  const token = readAccessToken(ctx);
  if (!token) {
    ctx.status = 401;
    ctx.body = {
      error: '未提供认证信息'
    };
    return;
  }

  const claims = await authService.verifyAccessToken(token);
  if (!claims) {
    ctx.status = 401;
    ctx.body = {
      error: '无效的认证信息'
    };
    return;
  }

  ctx.state.user = {
    id: claims.user_id,
    username: claims.username,
    role: claims.role
  } satisfies AuthenticatedUser;

  await next();
}

function readAccessToken(ctx: Context) {
  const authorization = ctx.get('Authorization');
  if (authorization) {
    const [scheme, token] = authorization.split(' ');

    if (scheme === 'Bearer' && token) {
      return token;
    }

    return null;
  }

  const queryToken = ctx.query.token;
  return typeof queryToken === 'string' ? queryToken : null;
}

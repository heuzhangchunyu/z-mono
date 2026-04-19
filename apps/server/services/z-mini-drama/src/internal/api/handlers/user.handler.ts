import type { Context } from 'koa';
import type { UserRepository } from '../../repository/user.repository.js';
import type { AuthenticatedUser } from '../../model/auth.js';
import type { CurrentUserResponse } from '../../model/user.js';

export class UserHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async getCurrentUser(ctx: Context) {
    const authenticatedUser = ctx.state.user as AuthenticatedUser | undefined;
    if (!authenticatedUser) {
      ctx.status = 401;
      ctx.body = {
        error: '未登录'
      };
      return;
    }

    const user = await this.userRepository.findById(authenticatedUser.id);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        error: '用户不存在'
      };
      return;
    }

    const responseBody: CurrentUserResponse = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      created_at: user.createdAt
    };

    ctx.body = responseBody;
  }
}

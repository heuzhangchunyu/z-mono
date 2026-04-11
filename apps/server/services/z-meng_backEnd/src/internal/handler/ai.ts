import type Koa from 'koa';

import { readJsonBody } from '../http/body.js';
import { readAuthenticatedUserId } from '../http/session.js';
import type { GenerateChatPayload } from '../model/ai.js';
import { AIChatService } from '../service/aiChatService.js';
import { AuthService } from '../service/authService.js';

export function createGenerateChatHandler(authService: AuthService, aiChatService: AIChatService): Koa.Middleware {
  return async (ctx) => {
    const payload = await readJsonBody<GenerateChatPayload>(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const result = await aiChatService.generateChat(user.id, payload);

    ctx.status = 200;
    ctx.body = {
      message: 'AI completion generated successfully.',
      data: result
    };
  };
}

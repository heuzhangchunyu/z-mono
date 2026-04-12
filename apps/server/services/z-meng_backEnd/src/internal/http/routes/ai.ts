import Router from 'koa-router';

import { createGenerateChatHandler } from '../../handler/ai.js';
import { AIChatService } from '../../service/aiChatService.js';
import { AuthService } from '../../service/authService.js';

interface CreateAIRouterInput {
  authService: AuthService;
  aiChatService: AIChatService;
}

export function createAIRouter(input: CreateAIRouterInput): Router {
  const router = new Router({ prefix: '/ai' });

  router.post('/chat', createGenerateChatHandler(input.authService, input.aiChatService));

  return router;
}

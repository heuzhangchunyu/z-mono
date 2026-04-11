import Router from 'koa-router';
import type { Pool } from 'pg';

import { createGenerateChatHandler } from '../handler/ai.js';
import { createLoginHandler, createRegisterHandler } from '../handler/auth.js';
import {
  createCreateEpisodeHandler,
  createListEpisodesHandler,
  createUpdateEpisodeScriptHandler,
  createUpdateEpisodeStageHandler
} from '../handler/episode.js';
import { AIChatService } from '../service/aiChatService.js';
import { AuthService } from '../service/authService.js';
import { EpisodeService } from '../service/episodeService.js';

interface CreateRouterInput {
  database: Pool;
  authService: AuthService;
  episodeService: EpisodeService;
  aiChatService: AIChatService;
  databaseHost: string;
  databaseName: string;
}

export function createRouter(input: CreateRouterInput): Router {
  const router = new Router();

  router.get('/health', async (ctx) => {
    await input.database.query('SELECT 1');
    ctx.body = {
      status: 'ok'
    };
  });

  router.post('/auth/register', createRegisterHandler(input.authService));
  router.post('/auth/login', createLoginHandler(input.authService));
  router.post('/episodes', createCreateEpisodeHandler(input.authService, input.episodeService));
  router.get('/episodes', createListEpisodesHandler(input.authService, input.episodeService));
  router.patch('/episodes/:episodeId/script', createUpdateEpisodeScriptHandler(input.authService, input.episodeService));
  router.patch('/episodes/:episodeId/stage', createUpdateEpisodeStageHandler(input.authService, input.episodeService));
  router.post('/ai/chat', createGenerateChatHandler(input.authService, input.aiChatService));

  router.get('/', (ctx) => {
    ctx.body = {
      service: 'z-meng-backend',
      message: 'z-meng AI comic drama service is running.',
      database: {
        host: input.databaseHost,
        name: input.databaseName
      },
      modules: ['script', 'storyboard', 'asset-generation', 'voice-sync']
    };
  });

  return router;
}

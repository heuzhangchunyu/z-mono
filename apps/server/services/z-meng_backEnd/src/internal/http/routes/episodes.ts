import Router from 'koa-router';

import {
  createCreateEpisodeHandler,
  createExtractEpisodeSubjectsHandler,
  createGetEpisodeSubjectsHandler,
  createListEpisodesHandler,
  createUpdateEpisodeScriptHandler,
  createUpdateEpisodeStageHandler
} from '../../handler/episode.js';
import { AuthService } from '../../service/authService.js';
import { EpisodeService } from '../../service/episodeService.js';
import { EpisodeSubjectService } from '../../service/episodeSubjectService.js';

interface CreateEpisodesRouterInput {
  authService: AuthService;
  episodeService: EpisodeService;
  episodeSubjectService: EpisodeSubjectService;
}

export function createEpisodesRouter(input: CreateEpisodesRouterInput): Router {
  const router = new Router({ prefix: '/episodes' });

  router.post('/', createCreateEpisodeHandler(input.authService, input.episodeService));
  router.get('/', createListEpisodesHandler(input.authService, input.episodeService));
  router.get('/:episodeId/subjects', createGetEpisodeSubjectsHandler(input.authService, input.episodeSubjectService));
  router.post('/:episodeId/subjects/extract', createExtractEpisodeSubjectsHandler(input.authService, input.episodeSubjectService));
  router.patch('/:episodeId/script', createUpdateEpisodeScriptHandler(input.authService, input.episodeService));
  router.patch('/:episodeId/stage', createUpdateEpisodeStageHandler(input.authService, input.episodeService));

  return router;
}

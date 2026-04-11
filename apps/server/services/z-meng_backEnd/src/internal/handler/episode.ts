import type Koa from 'koa';

import { createBadRequestError, readJsonBody } from '../http/body.js';
import { readAuthenticatedUserId } from '../http/session.js';
import type {
  CreateEpisodePayload,
  UpdateEpisodeScriptPayload,
  UpdateEpisodeStagePayload
} from '../model/episode.js';
import { AuthService } from '../service/authService.js';
import { EpisodeService } from '../service/episodeService.js';

export function createCreateEpisodeHandler(authService: AuthService, episodeService: EpisodeService): Koa.Middleware {
  return async (ctx) => {
    const payload = await readJsonBody<CreateEpisodePayload>(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const episode = await episodeService.createEpisode(user.id, payload);

    ctx.status = 201;
    ctx.body = {
      message: `Episode ${episode.scriptId} created successfully.`,
      data: episode
    };
  };
}

export function createListEpisodesHandler(authService: AuthService, episodeService: EpisodeService): Koa.Middleware {
  return async (ctx) => {
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const episodes = await episodeService.listEpisodes(user.id);

    ctx.status = 200;
    ctx.body = {
      data: episodes
    };
  };
}

export function createUpdateEpisodeScriptHandler(authService: AuthService, episodeService: EpisodeService): Koa.Middleware {
  return async (ctx) => {
    const episodeId = readEpisodeId(ctx);
    const payload = await readJsonBody<UpdateEpisodeScriptPayload>(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const episode = await episodeService.updateEpisodeScript(episodeId, user.id, payload);

    ctx.status = 200;
    ctx.body = {
      message: `Episode ${episode.scriptId} script updated successfully.`,
      data: episode
    };
  };
}

export function createUpdateEpisodeStageHandler(authService: AuthService, episodeService: EpisodeService): Koa.Middleware {
  return async (ctx) => {
    const episodeId = readEpisodeId(ctx);
    const payload = await readJsonBody<UpdateEpisodeStagePayload>(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const episode = await episodeService.updateEpisodeStage(episodeId, user.id, payload);

    ctx.status = 200;
    ctx.body = {
      message: `Episode ${episode.scriptId} stage updated successfully.`,
      data: episode
    };
  };
}

function readEpisodeId(ctx: Koa.Context): number {
  const rawEpisodeId = ctx.params.episodeId?.trim() ?? '';
  const episodeId = Number(rawEpisodeId);

  if (!Number.isInteger(episodeId) || episodeId <= 0) {
    throw createBadRequestError('A valid episode ID is required.');
  }

  return episodeId;
}

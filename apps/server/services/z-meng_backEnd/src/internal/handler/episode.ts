import type Koa from 'koa';

import { createBadRequestError, readJsonBody } from '../http/body.js';
import { readAuthenticatedUserId } from '../http/session.js';
import type {
  CreateEpisodePayload,
  UpdateEpisodeScriptPayload,
  UpdateEpisodeStagePayload
} from '../model/episode.js';
import type { CreateEpisodeSubjectImagePayload } from '../model/episodeSubjectImage.js';
import { AuthService } from '../service/authService.js';
import { EpisodeService } from '../service/episodeService.js';
import { EpisodeSubjectService } from '../service/episodeSubjectService.js';
import { EpisodeSubjectImageService } from '../service/episodeSubjectImageService.js';

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

export function createGetEpisodeSubjectsHandler(
  authService: AuthService,
  episodeSubjectService: EpisodeSubjectService
): Koa.Middleware {
  return async (ctx) => {
    const episodeId = readEpisodeId(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const subjectRecord = await episodeSubjectService.getEpisodeSubjects(episodeId, user.id);

    ctx.status = 200;
    ctx.body = {
      data: subjectRecord
    };
  };
}

export function createExtractEpisodeSubjectsHandler(
  authService: AuthService,
  episodeSubjectService: EpisodeSubjectService
): Koa.Middleware {
  return async (ctx) => {
    const episodeId = readEpisodeId(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const subjectRecord = await episodeSubjectService.triggerSubjectExtraction(episodeId, user.id);

    ctx.status = 202;
    ctx.body = {
      message: 'Episode subject extraction started.',
      data: subjectRecord
    };
  };
}

// Returns one subject item's image generation history and the latest top-level status for polling.
export function createGetEpisodeSubjectImagesHandler(
  authService: AuthService,
  episodeSubjectImageService: EpisodeSubjectImageService
): Koa.Middleware {
  return async (ctx) => {
    const subjectItemId = readSubjectItemId(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const feed = await episodeSubjectImageService.getSubjectImageFeed(subjectItemId, user.id);

    ctx.status = 200;
    ctx.body = {
      data: feed
    };
  };
}

// Starts one subject image generation task and immediately returns the persisted processing record.
export function createGenerateEpisodeSubjectImageHandler(
  authService: AuthService,
  episodeSubjectImageService: EpisodeSubjectImageService
): Koa.Middleware {
  return async (ctx) => {
    const subjectItemId = readSubjectItemId(ctx);
    const payload = await readJsonBody<CreateEpisodeSubjectImagePayload>(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));
    const record = await episodeSubjectImageService.triggerSubjectImageGeneration(subjectItemId, user.id, payload);

    ctx.status = 202;
    ctx.body = {
      message: 'Subject image generation started.',
      data: record
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

// Reads and validates the normalized subject item id used by the subject image APIs.
function readSubjectItemId(ctx: Koa.Context): number {
  const rawSubjectItemId = ctx.params.subjectItemId?.trim() ?? '';
  const subjectItemId = Number(rawSubjectItemId);

  if (!Number.isInteger(subjectItemId) || subjectItemId <= 0) {
    throw createBadRequestError('A valid subject item ID is required.');
  }

  return subjectItemId;
}

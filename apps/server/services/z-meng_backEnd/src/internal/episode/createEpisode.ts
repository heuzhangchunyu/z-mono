import type Koa from 'koa';

import { requireAuthenticatedUser } from '../auth/session.js';
import { createBadRequestError, readJsonBody } from '../http/body.js';
import { EpisodeRepository } from '../repository/episode.js';
import { UserRepository } from '../repository/user.js';

interface CreateEpisodePayload {
  episodeName?: string;
  script?: string;
  style?: '动漫' | '真人';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

const VALID_STYLES = new Set<CreateEpisodePayload['style']>(['动漫', '真人']);
const VALID_ASPECT_RATIOS = new Set<CreateEpisodePayload['aspectRatio']>(['16:9', '9:16', '1:1']);

export async function handleCreateEpisode(
  ctx: Koa.Context,
  episodeRepository: EpisodeRepository,
  userRepository: UserRepository
): Promise<void> {
  const payload = await readJsonBody<CreateEpisodePayload>(ctx);
  const episodeName = payload.episodeName?.trim() ?? '';
  const script = payload.script?.trim() ?? '';
  const style = payload.style;
  const aspectRatio = payload.aspectRatio;
  const user = await requireAuthenticatedUser(ctx, userRepository);

  if (!episodeName) {
    throw createBadRequestError('Episode name is required.');
  }

  if (episodeName.length > 120) {
    throw createBadRequestError('Episode name must be 120 characters or fewer.');
  }

  if (!script) {
    throw createBadRequestError('Script content is required.');
  }

  if (!style || !VALID_STYLES.has(style)) {
    throw createBadRequestError('Style must be one of: 动漫, 真人.');
  }

  if (!aspectRatio || !VALID_ASPECT_RATIOS.has(aspectRatio)) {
    throw createBadRequestError('Aspect ratio must be one of: 16:9, 9:16, 1:1.');
  }

  const episode = await episodeRepository.createEpisode({
    userId: user.id,
    episodeName,
    scriptContent: script,
    style,
    aspectRatio
  });

  ctx.status = 201;
  ctx.body = {
    message: `Episode ${episode.scriptId} created successfully.`,
    data: episode
  };
}

import type Koa from 'koa';

import { requireAuthenticatedUser } from '../auth/session.js';
import { EpisodeRepository } from '../repository/episode.js';
import { UserRepository } from '../repository/user.js';

export async function handleListEpisodes(
  ctx: Koa.Context,
  episodeRepository: EpisodeRepository,
  userRepository: UserRepository
): Promise<void> {
  const user = await requireAuthenticatedUser(ctx, userRepository);

  const episodes = await episodeRepository.listEpisodesByUserId(user.id);
  ctx.status = 200;
  ctx.body = {
    data: episodes
  };
}

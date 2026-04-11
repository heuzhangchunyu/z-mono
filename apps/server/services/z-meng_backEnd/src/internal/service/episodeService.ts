import { createBadRequestError, createHttpError } from '../http/body.js';
import {
  EPISODE_ASPECT_RATIOS,
  EPISODE_STAGES,
  EPISODE_STYLES,
  type CreateEpisodePayload,
  type EpisodeRecord,
  type EpisodeStage,
  type UpdateEpisodeScriptPayload,
  type UpdateEpisodeStagePayload
} from '../model/episode.js';
import { EpisodeRepository } from '../repository/episode.js';

const VALID_STYLES = new Set(EPISODE_STYLES);
const VALID_ASPECT_RATIOS = new Set(EPISODE_ASPECT_RATIOS);
const VALID_STAGES = new Set<EpisodeStage>(EPISODE_STAGES);

export class EpisodeService {
  constructor(private readonly episodeRepository: EpisodeRepository) {}

  async createEpisode(userId: number, payload: CreateEpisodePayload): Promise<EpisodeRecord> {
    const episodeName = payload.episodeName?.trim() ?? '';
    const style = payload.style;
    const aspectRatio = payload.aspectRatio;

    if (!episodeName) {
      throw createBadRequestError('Episode name is required.');
    }

    if (episodeName.length > 120) {
      throw createBadRequestError('Episode name must be 120 characters or fewer.');
    }

    if (!style || !VALID_STYLES.has(style)) {
      throw createBadRequestError('Style must be one of: 动漫, 真人.');
    }

    if (!aspectRatio || !VALID_ASPECT_RATIOS.has(aspectRatio)) {
      throw createBadRequestError('Aspect ratio must be one of: 16:9, 9:16, 1:1.');
    }

    return this.episodeRepository.createEpisode({
      userId,
      episodeName,
      style,
      aspectRatio
    });
  }

  async listEpisodes(userId: number): Promise<EpisodeRecord[]> {
    return this.episodeRepository.listEpisodesByUserId(userId);
  }

  async updateEpisodeScript(
    episodeId: number,
    userId: number,
    payload: UpdateEpisodeScriptPayload
  ): Promise<EpisodeRecord> {
    const scriptContent = payload.scriptContent?.trim() ?? '';
    const episode = await this.episodeRepository.updateEpisodeScriptContent(episodeId, userId, scriptContent, 'subject');

    if (!episode) {
      throw createHttpError(404, `Episode "${episodeId}" not found.`);
    }

    return episode;
  }

  async updateEpisodeStage(
    episodeId: number,
    userId: number,
    payload: UpdateEpisodeStagePayload
  ): Promise<EpisodeRecord> {
    const currentStage = payload.currentStage;

    if (!currentStage || !VALID_STAGES.has(currentStage)) {
      throw createBadRequestError('A valid currentStage is required.');
    }

    const episode = await this.episodeRepository.updateEpisodeCurrentStage(episodeId, userId, currentStage);

    if (!episode) {
      throw createHttpError(404, `Episode "${episodeId}" not found.`);
    }

    return episode;
  }
}

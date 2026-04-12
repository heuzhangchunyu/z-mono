import type { ImageGenerationProvider } from '../ai/provider.js';
import { createBadRequestError, createHttpError } from '../http/body.js';
import type { EpisodeAspectRatio } from '../model/episode.js';
import type {
  CreateEpisodeSubjectImagePayload,
  EpisodeSubjectImageFeed,
  EpisodeSubjectImageRecord
} from '../model/episodeSubjectImage.js';
import { EpisodeSubjectRepository } from '../repository/episodeSubject.js';
import { EpisodeSubjectImageRepository } from '../repository/episodeSubjectImage.js';

export class EpisodeSubjectImageService {
  constructor(
    private readonly episodeSubjectRepository: EpisodeSubjectRepository,
    private readonly episodeSubjectImageRepository: EpisodeSubjectImageRepository,
    private readonly imageGenerationProvider: ImageGenerationProvider,
    private readonly imageModel: string
  ) {}

  // Returns the full generation history for one subject item and exposes a waiting status before any request starts.
  async getSubjectImageFeed(subjectItemId: number, userId: number): Promise<EpisodeSubjectImageFeed> {
    const subjectItem = await this.episodeSubjectRepository.findSubjectItemContextByIdAndUserId(subjectItemId, userId);
    if (!subjectItem) {
      throw createHttpError(404, `Subject "${subjectItemId}" not found.`);
    }

    return (
      await this.episodeSubjectImageRepository.listBySubjectItemIdAndUserId(subjectItemId, userId)
    ) ?? {
      subjectItemId,
      status: 'waiting',
      records: []
    };
  }

  // Creates one processing image generation task and continues the actual image request in the background.
  async triggerSubjectImageGeneration(
    subjectItemId: number,
    userId: number,
    payload: CreateEpisodeSubjectImagePayload
  ): Promise<EpisodeSubjectImageRecord> {
    const prompt = payload.prompt?.trim() ?? '';
    if (!prompt) {
      throw createBadRequestError('Image prompt is required.');
    }

    const subjectItem = await this.episodeSubjectRepository.findSubjectItemContextByIdAndUserId(subjectItemId, userId);
    if (!subjectItem) {
      throw createHttpError(404, `Subject "${subjectItemId}" not found.`);
    }

    if (!subjectItem.scriptContent.trim()) {
      throw createBadRequestError('Script content is required before generating subject images.');
    }

    const record = await this.episodeSubjectImageRepository.createProcessingRecord({
      subjectItemId,
      userId,
      prompt,
      provider: this.imageGenerationProvider.getProviderName(),
      model: this.imageModel
    });

    if (!record) {
      throw createHttpError(404, `Subject "${subjectItemId}" image task could not be created.`);
    }

    queueMicrotask(() => {
      void this.generateImageInBackground(record.id, userId, {
        subjectName: subjectItem.subjectName,
        subjectType: subjectItem.subjectType,
        scriptContent: subjectItem.scriptContent,
        aspectRatio: subjectItem.aspectRatio,
        userPrompt: prompt
      });
    });

    return record;
  }

  // Sends the image generation request to DashScope and updates the persisted task state when it finishes.
  private async generateImageInBackground(
    recordId: number,
    userId: number,
    input: {
      subjectName: string;
      subjectType: 'character' | 'scene' | 'prop';
      scriptContent: string;
      aspectRatio: string;
      userPrompt: string;
    }
  ): Promise<void> {
    try {
      const result = await this.imageGenerationProvider.generateImage({
        prompt: buildSubjectImagePrompt(input),
        size: mapAspectRatioToDashScopeSize(input.aspectRatio as EpisodeAspectRatio)
      });

      await this.episodeSubjectImageRepository.markSuccess(recordId, userId, result.imageUrl);
    } catch (error) {
      console.error('Failed to generate subject image.', error);
      const message = error instanceof Error ? error.message : '主体生图失败。';
      await this.episodeSubjectImageRepository.markFailed(recordId, userId, message);
    }
  }
}

// Builds a focused image prompt from the subject, the episode script, and the user's additional art direction.
function buildSubjectImagePrompt(input: {
  subjectName: string;
  subjectType: 'character' | 'scene' | 'prop';
  scriptContent: string;
  aspectRatio: string;
  userPrompt: string;
}): string {
  return [
    `你是一名专业的影视概念设计师，请围绕给定主体生成一张高质量概念图。`,
    `主体类型：${formatSubjectType(input.subjectType)}`,
    `主体名称：${input.subjectName}`,
    `画面比例：${input.aspectRatio}`,
    `剧本内容：${input.scriptContent}`,
    `用户补充要求：${input.userPrompt}`,
    `请保持主体名称和剧本设定一致，不要偏离当前剧本世界观。`
  ].join('\n');
}

// Maps the episode aspect ratio to a DashScope image size that matches the intended canvas shape.
function mapAspectRatioToDashScopeSize(aspectRatio: EpisodeAspectRatio): string {
  switch (aspectRatio) {
    case '16:9':
      return '2688*1536';
    case '9:16':
      return '1536*2688';
    case '1:1':
    default:
      return '2048*2048';
  }
}

// Converts the stored subject type into a Chinese label so the image prompt reads naturally.
function formatSubjectType(subjectType: 'character' | 'scene' | 'prop'): string {
  switch (subjectType) {
    case 'character':
      return '角色';
    case 'scene':
      return '场景';
    case 'prop':
    default:
      return '道具';
  }
}

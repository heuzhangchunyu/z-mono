import { createBadRequestError, createHttpError } from '../http/body.js';
import type { EpisodeSubjectExtractionResult, EpisodeSubjectRecord } from '../model/episodeSubject.js';
import { EpisodeRepository } from '../repository/episode.js';
import { EpisodeSubjectRepository } from '../repository/episodeSubject.js';
import { AIChatService } from './aiChatService.js';

export class EpisodeSubjectService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly episodeSubjectRepository: EpisodeSubjectRepository,
    private readonly aiChatService: AIChatService
  ) {}

  async getEpisodeSubjects(episodeId: number, userId: number): Promise<EpisodeSubjectRecord> {
    const episode = await this.episodeRepository.findEpisodeByScriptIdAndUserId(episodeId, userId);
    if (!episode) {
      throw createHttpError(404, `Episode "${episodeId}" not found.`);
    }

    const subjectRecord = await this.episodeSubjectRepository.ensureWaitingRecord(episodeId, userId);
    if (!subjectRecord) {
      throw createHttpError(404, `Episode "${episodeId}" subject record not found.`);
    }

    return subjectRecord;
  }

  async triggerSubjectExtraction(episodeId: number, userId: number): Promise<EpisodeSubjectRecord> {
    const episode = await this.episodeRepository.findEpisodeByScriptIdAndUserId(episodeId, userId);
    if (!episode) {
      throw createHttpError(404, `Episode "${episodeId}" not found.`);
    }

    if (!episode.scriptContent.trim()) {
      throw createBadRequestError('Script content is required before extracting subjects.');
    }

    const processingRecord = await this.episodeSubjectRepository.markProcessing(episodeId, userId);
    if (!processingRecord) {
      throw createHttpError(404, `Episode "${episodeId}" subject record not found.`);
    }

    queueMicrotask(() => {
      void this.extractSubjectsInBackground(episodeId, userId, episode.scriptContent);
    });

    return processingRecord;
  }

  private async extractSubjectsInBackground(
    episodeId: number,
    userId: number,
    scriptContent: string
  ): Promise<void> {
    try {
      const result = await this.aiChatService.generateChat(userId, {
        templateType: 'extract_subjects',
        templateVariables: {
          content: scriptContent
        },
        source: 'episode_subject_extraction'
      });

      const extraction = parseEpisodeSubjectResult(result.text);
      await this.episodeSubjectRepository.markSuccess(episodeId, userId, extraction);
    } catch (error) {
      console.error('Failed to extract episode subjects.', error);
      const message = error instanceof Error ? error.message : '主体提取失败。';
      await this.episodeSubjectRepository.markFailed(episodeId, userId, message);
    }
  }
}

function parseEpisodeSubjectResult(text: string): EpisodeSubjectExtractionResult {
  const jsonPayload = extractJsonPayload(text);
  const parsed = JSON.parse(jsonPayload) as {
    characters?: unknown;
    environments?: unknown;
    scenes?: unknown;
    props?: unknown;
  };

  return {
    characters: normalizeSubjectNames(parsed.characters),
    scenes: normalizeSubjectNames(parsed.scenes ?? parsed.environments),
    props: normalizeSubjectNames(parsed.props)
  };
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const withoutCodeBlock = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const firstBraceIndex = withoutCodeBlock.indexOf('{');
  const lastBraceIndex = withoutCodeBlock.lastIndexOf('}');

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
    throw new Error('LLM did not return valid subject JSON.');
  }

  return withoutCodeBlock.slice(firstBraceIndex, lastBraceIndex + 1);
}

function normalizeSubjectNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const names: string[] = [];

  for (const item of value) {
    const name = readName(item);
    if (!name || names.includes(name)) {
      continue;
    }
    names.push(name);
  }

  return names;
}

function readName(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object' && value && 'name' in value && typeof value.name === 'string') {
    return value.name.trim();
  }

  return '';
}

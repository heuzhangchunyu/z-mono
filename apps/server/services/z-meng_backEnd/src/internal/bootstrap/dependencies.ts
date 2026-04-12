import type { Pool } from 'pg';

import { createImageGenerationProvider, createTextGenerationProvider } from '../ai/factory.js';
import type { Config } from '../config/config.js';
import { EpisodeRepository } from '../repository/episode.js';
import { EpisodeSubjectRepository } from '../repository/episodeSubject.js';
import { EpisodeSubjectImageRepository } from '../repository/episodeSubjectImage.js';
import { LLMCallLogRepository } from '../repository/llmCallLog.js';
import { createDatabasePool } from '../repository/postgres.js';
import { PromptTemplateRepository } from '../repository/promptTemplate.js';
import { UserRepository } from '../repository/user.js';
import { AIChatService } from '../service/aiChatService.js';
import { AuthService } from '../service/authService.js';
import { EpisodeService } from '../service/episodeService.js';
import { EpisodeSubjectService } from '../service/episodeSubjectService.js';
import { EpisodeSubjectImageService } from '../service/episodeSubjectImageService.js';
import { LLMCallLogService } from '../service/llmCallLogService.js';
import { PromptTemplateService } from '../service/promptTemplateService.js';

export interface AppDependencies {
  database: Pool;
  authService: AuthService;
  episodeService: EpisodeService;
  episodeSubjectService: EpisodeSubjectService;
  episodeSubjectImageService: EpisodeSubjectImageService;
  aiChatService: AIChatService;
}

export async function createDependencies(config: Config): Promise<AppDependencies> {
  const database = createDatabasePool(config.database);
  await database.query('SELECT 1');

  const userRepository = new UserRepository(database);
  const episodeRepository = new EpisodeRepository(database);
  const episodeSubjectRepository = new EpisodeSubjectRepository(database);
  const episodeSubjectImageRepository = new EpisodeSubjectImageRepository(database);
  const promptTemplateRepository = new PromptTemplateRepository(database);
  const llmCallLogRepository = new LLMCallLogRepository(database);

  const authService = new AuthService(userRepository);
  const episodeService = new EpisodeService(episodeRepository);
  const promptTemplateService = new PromptTemplateService(promptTemplateRepository);
  const llmCallLogService = new LLMCallLogService(llmCallLogRepository);
  const aiChatService = new AIChatService(
    createTextGenerationProvider(config.ai),
    promptTemplateService,
    llmCallLogService
  );
  const episodeSubjectService = new EpisodeSubjectService(
    episodeRepository,
    episodeSubjectRepository,
    aiChatService
  );
  const episodeSubjectImageService = new EpisodeSubjectImageService(
    episodeSubjectRepository,
    episodeSubjectImageRepository,
    createImageGenerationProvider(config.ai),
    config.ai.imageModel
  );

  return {
    database,
    authService,
    episodeService,
    episodeSubjectService,
    episodeSubjectImageService,
    aiChatService
  };
}

export async function disposeDependencies(dependencies: AppDependencies): Promise<void> {
  await dependencies.database.end();
}

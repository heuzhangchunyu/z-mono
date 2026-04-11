import type { TextGenerationResult } from '../ai/provider.js';
import { LLMCallLogRepository } from '../repository/llmCallLog.js';

interface LogLLMCallInput {
  userId: number | null;
  promptTemplateId: number | null;
  provider: string;
  model: string;
  source: string;
  input: string;
  output: string;
  finishReason: string | null;
  usage: TextGenerationResult['usage'];
}

export class LLMCallLogService {
  constructor(private readonly llmCallLogRepository: LLMCallLogRepository) {}

  async logCall(input: LogLLMCallInput): Promise<void> {
    await this.llmCallLogRepository.createLog({
      userId: input.userId,
      promptTemplateId: input.promptTemplateId,
      provider: input.provider,
      model: input.model,
      source: input.source,
      input: input.input,
      output: input.output,
      finishReason: input.finishReason,
      inputTokens: input.usage?.inputTokens ?? 0,
      outputTokens: input.usage?.outputTokens ?? 0,
      totalTokens: input.usage?.totalTokens ?? 0
    });
  }
}

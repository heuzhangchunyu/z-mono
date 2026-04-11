import type { TextGenerationProvider } from '../ai/provider.js';
import { createBadRequestError } from '../http/body.js';
import type { GenerateChatPayload } from '../model/ai.js';
import { LLMCallLogService } from './llmCallLogService.js';
import { PromptTemplateService } from './promptTemplateService.js';

export class AIChatService {
  constructor(
    private readonly textGenerationProvider: TextGenerationProvider,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly llmCallLogService: LLMCallLogService
  ) {}

  async generateChat(userId: number, payload: GenerateChatPayload): Promise<{
    text: string;
    model: string;
    finishReason: string | null;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    } | null;
    promptTemplateId: number | null;
    templateType: string | null;
  }> {
    const templateType = payload.templateType?.trim() ?? '';
    let prompt = payload.prompt?.trim() ?? '';
    let systemPrompt = payload.systemPrompt?.trim() || undefined;
    let model = payload.model?.trim() || undefined;
    let promptTemplateId: number | null = null;

    if (!templateType && !prompt) {
      throw createBadRequestError('prompt is required.');
    }

    if (templateType) {
      const renderedTemplate = await this.promptTemplateService.renderTemplateByType(
        templateType,
        normalizeTemplateVariables(payload.templateVariables)
      );
      prompt = renderedTemplate.prompt;
      promptTemplateId = renderedTemplate.template.id;
      systemPrompt = systemPrompt ?? renderedTemplate.systemPrompt ?? undefined;
      model = model ?? renderedTemplate.model ?? undefined;
    }

    const result = await this.textGenerationProvider.generateText({
      prompt,
      systemPrompt,
      model,
      temperature: payload.temperature
    });

    try {
      await this.llmCallLogService.logCall({
        userId,
        promptTemplateId,
        provider: this.textGenerationProvider.getProviderName(),
        model: result.model,
        source: payload.source?.trim() || 'ai_chat',
        input: prompt,
        output: result.text,
        finishReason: result.finishReason,
        usage: result.usage
      });
    } catch (error) {
      console.error('Failed to write LLM call log.', error);
    }

    return {
      ...result,
      promptTemplateId,
      templateType: templateType || null
    };
  }
}

function normalizeTemplateVariables(
  variables: GenerateChatPayload['templateVariables']
): Record<string, string> {
  if (!variables) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(variables).map(([key, value]) => [key, value === null ? '' : String(value)])
  );
}

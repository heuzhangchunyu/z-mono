import type {
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
  TextGenerationStreamCompletedEvent
} from '../ai/provider.js';
import { createBadRequestError } from '../http/body.js';
import type { GenerateChatPayload } from '../model/ai.js';
import { LLMCallLogService } from './llmCallLogService.js';
import { PromptTemplateService } from './promptTemplateService.js';

interface ResolvedChatInput {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  promptTemplateId: number | null;
  templateType: string | null;
  source: string;
}

export interface AIChatResult {
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
}

export interface AIChatStreamDeltaEvent {
  type: 'delta';
  text: string;
  model: string | null;
}

export interface AIChatStreamCompletedEvent {
  type: 'completed';
  data: AIChatResult;
}

export type AIChatStreamEvent = AIChatStreamDeltaEvent | AIChatStreamCompletedEvent;

export class AIChatService {
  constructor(
    private readonly textGenerationProvider: TextGenerationProvider,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly llmCallLogService: LLMCallLogService
  ) {}

  async generateChat(userId: number, payload: GenerateChatPayload): Promise<AIChatResult> {
    const resolved = await this.resolveChatInput(payload);
    const result = await this.textGenerationProvider.generateText(this.toProviderInput(resolved));
    await this.logChatResult(userId, resolved, result);

    return {
      ...result,
      promptTemplateId: resolved.promptTemplateId,
      templateType: resolved.templateType
    };
  }

  async *streamChat(
    userId: number,
    payload: GenerateChatPayload,
    signal?: AbortSignal
  ): AsyncIterable<AIChatStreamEvent> {
    const resolved = await this.resolveChatInput(payload);

    for await (const event of this.textGenerationProvider.streamText({
      ...this.toProviderInput(resolved),
      signal
    })) {
      if (event.type === 'delta') {
        yield {
          type: 'delta',
          text: event.text,
          model: event.model
        };
        continue;
      }

      await this.logChatResult(userId, resolved, event);

      yield {
        type: 'completed',
        data: {
          text: event.text,
          model: event.model,
          finishReason: event.finishReason,
          usage: event.usage,
          promptTemplateId: resolved.promptTemplateId,
          templateType: resolved.templateType
        }
      };
    }
  }

  private async resolveChatInput(payload: GenerateChatPayload): Promise<ResolvedChatInput> {
    const templateType = payload.templateType?.trim() ?? '';
    let prompt = payload.prompt?.trim() ?? '';
    let systemPrompt = payload.systemPrompt?.trim() || undefined;
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
    }

    return {
      prompt,
      systemPrompt,
      temperature: payload.temperature,
      promptTemplateId,
      templateType: templateType || null,
      source: payload.source?.trim() || 'ai_chat'
    };
  }

  private toProviderInput(input: ResolvedChatInput): TextGenerationInput {
    return {
      prompt: input.prompt,
      systemPrompt: input.systemPrompt,
      temperature: input.temperature
    };
  }

  private async logChatResult(
    userId: number,
    resolved: ResolvedChatInput,
    result: TextGenerationResult | TextGenerationStreamCompletedEvent
  ): Promise<void> {
    try {
      await this.llmCallLogService.logCall({
        userId,
        promptTemplateId: resolved.promptTemplateId,
        provider: this.textGenerationProvider.getProviderName(),
        model: result.model,
        source: resolved.source,
        input: resolved.prompt,
        output: result.text,
        finishReason: result.finishReason,
        usage: result.usage
      });
    } catch (error) {
      console.error('Failed to write LLM call log.', error);
    }
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

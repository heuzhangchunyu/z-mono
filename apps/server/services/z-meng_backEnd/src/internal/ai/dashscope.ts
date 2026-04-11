import axios from 'axios';

import type { AIConfig } from '../config/config.js';
import { createHttpError } from '../http/body.js';
import type { TextGenerationInput, TextGenerationProvider, TextGenerationResult } from './provider.js';

interface DashScopeMessageContentItem {
  text?: string;
}

interface DashScopeMessage {
  content?: string | DashScopeMessageContentItem[];
}

interface DashScopeChoice {
  finish_reason?: string | null;
  message?: DashScopeMessage;
}

interface DashScopeUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface DashScopeChatCompletionResponse {
  model?: string;
  choices?: DashScopeChoice[];
  usage?: DashScopeUsage;
}

export class DashScopeClient implements TextGenerationProvider {
  constructor(private readonly config: AIConfig) {}

  getProviderName(): string {
    return this.config.provider;
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey.trim());
  }

  async generateText(input: TextGenerationInput): Promise<TextGenerationResult> {
    if (!this.isConfigured()) {
      throw createHttpError(503, 'DashScope API key is not configured.');
    }

    try {
      const response = await axios.post<DashScopeChatCompletionResponse>(
        `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model: input.model ?? this.config.model,
          temperature: input.temperature ?? 0.7,
          messages: [
            {
              role: 'system',
              content: input.systemPrompt?.trim() || 'You are a helpful creative assistant for episodic storytelling.'
            },
            {
              role: 'user',
              content: input.prompt
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const firstChoice = response.data.choices?.[0];
      const text = normalizeMessageContent(firstChoice?.message?.content);

      if (!text) {
        throw createHttpError(502, 'DashScope returned an empty response.');
      }

      return {
        text,
        model: response.data.model ?? input.model ?? this.config.model,
        finishReason: firstChoice?.finish_reason ?? null,
        usage: response.data.usage
          ? {
              inputTokens: response.data.usage.prompt_tokens ?? 0,
              outputTokens: response.data.usage.completion_tokens ?? 0,
              totalTokens: response.data.usage.total_tokens ?? 0
            }
          : null
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const upstreamMessage = readDashScopeErrorMessage(error.response?.data);
        throw createHttpError(status === 400 || status === 401 || status === 403 ? status : 502, upstreamMessage);
      }

      throw error;
    }
  }
}

function normalizeMessageContent(content: string | DashScopeMessageContentItem[] | undefined): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => item.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n');
}

function readDashScopeErrorMessage(data: unknown): string {
  if (typeof data === 'object' && data && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data === 'object' && data && 'error' in data && typeof data.error === 'object' && data.error && 'message' in data.error && typeof data.error.message === 'string') {
    return data.error.message;
  }

  return 'DashScope request failed.';
}

import axios from 'axios';

import type { AIConfig } from '../config/config.js';
import { createHttpError } from '../http/body.js';
import type {
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
  TextGenerationStreamEvent,
  TextGenerationUsage
} from './provider.js';

interface DashScopeMessageContentItem {
  text?: string;
}

interface DashScopeMessage {
  content?: string | DashScopeMessageContentItem[];
}

interface DashScopeChoice {
  finish_reason?: string | null;
  delta?: DashScopeMessage;
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
          timeout: this.config.timeoutMs,
          signal: input.signal
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
        if (error.code === 'ECONNABORTED') {
          throw createHttpError(504, `DashScope request timed out after ${this.config.timeoutMs}ms.`);
        }

        const status = error.response?.status;
        const upstreamMessage = readDashScopeErrorMessage(error.response?.data);
        throw createHttpError(status === 400 || status === 401 || status === 403 ? status : 502, upstreamMessage);
      }

      throw error;
    }
  }

  async *streamText(input: TextGenerationInput): AsyncIterable<TextGenerationStreamEvent> {
    if (!this.isConfigured()) {
      throw createHttpError(503, 'DashScope API key is not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const cleanupExternalAbort = this.bindAbortSignal(input.signal, controller);

    try {
      const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: input.model ?? this.config.model,
          temperature: input.temperature ?? 0.7,
          stream: true,
          stream_options: {
            include_usage: true
          },
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
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await readErrorResponseData(response);
        const upstreamMessage = readDashScopeErrorMessage(errorData);
        throw createHttpError(response.status === 400 || response.status === 401 || response.status === 403 ? response.status : 502, upstreamMessage);
      }

      if (!response.body) {
        throw createHttpError(502, 'DashScope returned an empty stream response.');
      }

      let completed = false;
      let fullText = '';
      let model = input.model ?? this.config.model;
      let finishReason: string | null = null;
      let usage: TextGenerationUsage | null = null;

      for await (const data of readServerSentEvents(response.body)) {
        if (data === '[DONE]') {
          completed = true;
          break;
        }

        const parsed = JSON.parse(data) as DashScopeChatCompletionResponse;
        const firstChoice = parsed.choices?.[0];
        const deltaText = normalizeMessageContent(firstChoice?.delta?.content ?? firstChoice?.message?.content);

        if (parsed.model) {
          model = parsed.model;
        }

        if (parsed.usage) {
          usage = mapUsage(parsed.usage);
        }

        if (firstChoice?.finish_reason !== undefined) {
          finishReason = firstChoice.finish_reason ?? null;
        }

        if (!deltaText) {
          continue;
        }

        fullText += deltaText;
        yield {
          type: 'delta',
          text: deltaText,
          model
        };
      }

      if (!completed && !fullText) {
        throw createHttpError(502, 'DashScope returned an empty stream response.');
      }

      yield {
        type: 'completed',
        text: fullText,
        model,
        finishReason,
        usage
      };
    } catch (error) {
      if (isAbortLikeError(error)) {
        throw createHttpError(504, `DashScope request timed out after ${this.config.timeoutMs}ms.`);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      cleanupExternalAbort();
    }
  }

  private bindAbortSignal(signal: AbortSignal | undefined, controller: AbortController): () => void {
    if (!signal) {
      return () => undefined;
    }

    if (signal.aborted) {
      controller.abort();
      return () => undefined;
    }

    const abort = () => controller.abort();
    signal.addEventListener('abort', abort);

    return () => signal.removeEventListener('abort', abort);
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

function mapUsage(usage: DashScopeUsage): TextGenerationUsage {
  return {
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0
  };
}

async function readErrorResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function* readServerSentEvents(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const data = parseServerSentEvent(rawEvent);
      if (data !== null) {
        yield data;
      }

      separatorIndex = buffer.indexOf('\n\n');
    }

    if (done) {
      const remaining = parseServerSentEvent(buffer);
      if (remaining !== null) {
        yield remaining;
      }
      break;
    }
  }
}

function parseServerSentEvent(rawEvent: string): string | null {
  const lines = rawEvent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart());

  if (!dataLines.length) {
    return null;
  }

  return dataLines.join('\n');
}

function isAbortLikeError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

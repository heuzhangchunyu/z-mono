export interface TextGenerationInput {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export interface TextGenerationUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface TextGenerationResult {
  text: string;
  model: string;
  finishReason: string | null;
  usage: TextGenerationUsage | null;
}

export interface TextGenerationStreamDeltaEvent {
  type: 'delta';
  text: string;
  model: string | null;
}

export interface TextGenerationStreamCompletedEvent {
  type: 'completed';
  text: string;
  model: string;
  finishReason: string | null;
  usage: TextGenerationUsage | null;
}

export type TextGenerationStreamEvent =
  | TextGenerationStreamDeltaEvent
  | TextGenerationStreamCompletedEvent;

export interface TextGenerationProvider {
  getProviderName(): string;
  isConfigured(): boolean;
  generateText(input: TextGenerationInput): Promise<TextGenerationResult>;
  streamText(input: TextGenerationInput): AsyncIterable<TextGenerationStreamEvent>;
}

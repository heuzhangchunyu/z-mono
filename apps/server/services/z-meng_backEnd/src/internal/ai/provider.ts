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

export interface ImageGenerationInput {
  prompt: string;
  model?: string;
  size: string;
  signal?: AbortSignal;
}

export interface ImageGenerationResult {
  imageUrl: string;
  model: string;
  revisedPrompt: string | null;
}

export interface ImageGenerationProvider {
  getProviderName(): string;
  isConfigured(): boolean;
  generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}

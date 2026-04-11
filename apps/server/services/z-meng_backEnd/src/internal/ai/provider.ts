export interface TextGenerationInput {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
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

export interface TextGenerationProvider {
  getProviderName(): string;
  isConfigured(): boolean;
  generateText(input: TextGenerationInput): Promise<TextGenerationResult>;
}

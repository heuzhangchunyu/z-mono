export interface CreateLLMCallLogInput {
  userId: number | null;
  promptTemplateId: number | null;
  provider: string;
  model: string;
  source: string;
  input: string;
  output: string;
  finishReason: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

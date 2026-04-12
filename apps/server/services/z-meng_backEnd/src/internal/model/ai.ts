export type TemplateVariableValue = string | number | boolean | null;

export interface GenerateChatPayload {
  prompt?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  stream?: boolean;
  templateType?: string;
  templateVariables?: Record<string, TemplateVariableValue>;
  source?: string;
}

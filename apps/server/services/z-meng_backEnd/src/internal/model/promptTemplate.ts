export interface PromptTemplateRecord {
  id: number;
  type: string;
  description: string;
  template: string;
  systemPrompt: string | null;
  model: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

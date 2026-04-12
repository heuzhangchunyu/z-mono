import { createHttpError } from '../http/body.js';
import type { PromptTemplateRecord } from '../model/promptTemplate.js';
import { PromptTemplateRepository } from '../repository/promptTemplate.js';

export interface RenderedPromptTemplate {
  template: PromptTemplateRecord;
  prompt: string;
  systemPrompt: string | null;
}

export class PromptTemplateService {
  constructor(private readonly promptTemplateRepository: PromptTemplateRepository) {}

  async renderTemplateByType(type: string, variables: Record<string, string>): Promise<RenderedPromptTemplate> {
    const template = await this.promptTemplateRepository.findActiveByType(type);

    if (!template) {
      throw createHttpError(404, `Active prompt template "${type}" not found.`);
    }

    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replaceAll(`{${key}}`, value);
      prompt = prompt.replaceAll(`{{${key}}}`, value);
    }

    return {
      template,
      prompt,
      systemPrompt: template.systemPrompt
    };
  }
}

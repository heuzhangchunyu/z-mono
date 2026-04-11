import type { Pool } from 'pg';
import type { PromptTemplateRecord } from '../model/promptTemplate.js';

export type { PromptTemplateRecord } from '../model/promptTemplate.js';

export class PromptTemplateRepository {
  constructor(private readonly database: Pool) {}

  async findActiveByType(type: string): Promise<PromptTemplateRecord | null> {
    const result = await this.database.query<{
      id: string;
      type: string;
      description: string | null;
      template: string;
      system_prompt: string | null;
      model: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT id, type, description, template, system_prompt, model, is_active, created_at, updated_at
        FROM prompt_templates
        WHERE type = $1 AND is_active = TRUE AND deleted_at IS NULL
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `,
      [type]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      type: row.type,
      description: row.description ?? '',
      template: row.template,
      systemPrompt: row.system_prompt,
      model: row.model,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

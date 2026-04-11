import type { Pool } from 'pg';
import type { CreateLLMCallLogInput } from '../model/llmCallLog.js';

export class LLMCallLogRepository {
  constructor(private readonly database: Pool) {}

  async createLog(input: CreateLLMCallLogInput): Promise<void> {
    await this.database.query(
      `
        INSERT INTO llm_call_logs (
          user_id,
          prompt_template_id,
          provider,
          model,
          source,
          input,
          output,
          finish_reason,
          input_tokens,
          output_tokens,
          total_tokens,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `,
      [
        input.userId,
        input.promptTemplateId,
        input.provider,
        input.model,
        input.source,
        input.input,
        input.output,
        input.finishReason,
        input.inputTokens,
        input.outputTokens,
        input.totalTokens
      ]
    );
  }
}

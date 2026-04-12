import type { Pool } from 'pg';

import type { EpisodeSubjectImageFeed, EpisodeSubjectImageRecord, EpisodeSubjectImageStatus } from '../model/episodeSubjectImage.js';

interface EpisodeSubjectImageRow {
  id: string;
  subject_item_id: string;
  script_id: string;
  subject_type: 'character' | 'scene' | 'prop';
  subject_name: string;
  prompt: string;
  image_url: string | null;
  status: EpisodeSubjectImageStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export class EpisodeSubjectImageRepository {
  constructor(private readonly database: Pool) {}

  // Creates one processing image generation record so the frontend can start polling immediately.
  async createProcessingRecord(input: {
    subjectItemId: number;
    userId: number;
    prompt: string;
    provider: string;
    model: string;
  }): Promise<EpisodeSubjectImageRecord | null> {
    const result = await this.database.query<{ id: string }>(
      `
        INSERT INTO episode_subject_images (
          subject_item_id,
          script_id,
          prompt,
          image_url,
          status,
          provider,
          model,
          error_message,
          created_at,
          updated_at
        )
        SELECT
          items.id,
          items.script_id,
          $3,
          NULL,
          'processing',
          $4,
          $5,
          NULL,
          NOW(),
          NOW()
        FROM episode_subject_items AS items
        INNER JOIN episodes
          ON episodes.script_id = items.script_id
        WHERE items.id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
        RETURNING
          id,
          subject_item_id,
          script_id,
          prompt,
          image_url,
          status,
          error_message,
          created_at,
          updated_at
      `,
      [input.subjectItemId, input.userId, input.prompt, input.provider, input.model]
    );

    return this.findRecordByIdAndUserId(Number(result.rows[0]?.id ?? 0), input.userId);
  }

  // Marks one image generation as successful and saves the final image URL.
  async markSuccess(recordId: number, userId: number, imageUrl: string): Promise<EpisodeSubjectImageRecord | null> {
    await this.database.query(
      `
        UPDATE episode_subject_images AS images
        SET
          image_url = $3,
          status = 'success',
          error_message = NULL,
          updated_at = NOW()
        FROM episode_subject_items AS items
        INNER JOIN episodes
          ON episodes.script_id = items.script_id
        WHERE images.id = $1
          AND images.subject_item_id = items.id
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
      `,
      [recordId, userId, imageUrl]
    );

    return this.findRecordByIdAndUserId(recordId, userId);
  }

  // Marks one image generation as failed and stores the readable error message for polling clients.
  async markFailed(recordId: number, userId: number, errorMessage: string): Promise<EpisodeSubjectImageRecord | null> {
    await this.database.query(
      `
        UPDATE episode_subject_images AS images
        SET
          status = 'failed',
          error_message = $3,
          updated_at = NOW()
        FROM episode_subject_items AS items
        INNER JOIN episodes
          ON episodes.script_id = items.script_id
        WHERE images.id = $1
          AND images.subject_item_id = items.id
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
      `,
      [recordId, userId, errorMessage]
    );

    return this.findRecordByIdAndUserId(recordId, userId);
  }

  // Returns the latest generation feed for one subject item together with all historical records.
  async listBySubjectItemIdAndUserId(subjectItemId: number, userId: number): Promise<EpisodeSubjectImageFeed | null> {
    const result = await this.database.query<EpisodeSubjectImageRow>(
      `
        SELECT
          images.id,
          images.subject_item_id,
          images.script_id,
          items.subject_type,
          items.subject_name,
          images.prompt,
          images.image_url,
          images.status,
          images.error_message,
          images.created_at,
          images.updated_at
        FROM episode_subject_items AS items
        LEFT JOIN episode_subject_images AS images
          ON images.subject_item_id = items.id
        INNER JOIN episodes
          ON episodes.script_id = items.script_id
        WHERE items.id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
        ORDER BY images.created_at DESC NULLS LAST, images.id DESC NULLS LAST
      `,
      [subjectItemId, userId]
    );

    if (!result.rows.length) {
      return null;
    }

    const rows = result.rows.filter((row) => row.id);
    return {
      subjectItemId,
      status: rows[0]?.status ?? 'waiting',
      records: rows.map(mapEpisodeSubjectImageRow)
    };
  }

  // Loads one generation record by id while enforcing episode ownership.
  async findRecordByIdAndUserId(recordId: number, userId: number): Promise<EpisodeSubjectImageRecord | null> {
    if (!recordId) {
      return null;
    }

    const result = await this.database.query<EpisodeSubjectImageRow>(
      `
        SELECT
          images.id,
          images.subject_item_id,
          images.script_id,
          items.subject_type,
          items.subject_name,
          images.prompt,
          images.image_url,
          images.status,
          images.error_message,
          images.created_at,
          images.updated_at
        FROM episode_subject_images AS images
        INNER JOIN episode_subject_items AS items
          ON items.id = images.subject_item_id
        INNER JOIN episodes
          ON episodes.script_id = items.script_id
        WHERE images.id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
        LIMIT 1
      `,
      [recordId, userId]
    );

    const row = result.rows[0];
    return row ? mapEpisodeSubjectImageRow(row) : null;
  }
}

function mapEpisodeSubjectImageRow(row: EpisodeSubjectImageRow): EpisodeSubjectImageRecord {
  return {
    id: Number(row.id),
    subjectItemId: Number(row.subject_item_id),
    scriptId: Number(row.script_id),
    subjectType: row.subject_type,
    subjectName: row.subject_name,
    prompt: row.prompt,
    imageUrl: row.image_url,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

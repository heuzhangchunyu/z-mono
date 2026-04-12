import type { Pool } from 'pg';

import type {
  EpisodeSubjectExtractionResult,
  EpisodeSubjectRecord,
  EpisodeSubjectStatus
} from '../model/episodeSubject.js';

interface SubjectRow {
  script_id: string;
  status: EpisodeSubjectStatus;
  characters_json: unknown;
  scenes_json: unknown;
  props_json: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export class EpisodeSubjectRepository {
  constructor(private readonly database: Pool) {}

  async ensureWaitingRecord(episodeId: number, userId: number): Promise<EpisodeSubjectRecord | null> {
    const result = await this.database.query<SubjectRow>(
      `
        WITH owned_episode AS (
          SELECT script_id
          FROM episodes
          WHERE script_id = $1 AND user_id = $2 AND deleted_at IS NULL
        ),
        inserted_subjects AS (
          INSERT INTO episode_subjects (
            script_id,
            status,
            characters_json,
            scenes_json,
            props_json,
            error_message,
            created_at,
            updated_at
          )
          SELECT
            script_id,
            'waiting',
            '[]'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            NULL,
            NOW(),
            NOW()
          FROM owned_episode
          ON CONFLICT (script_id) DO NOTHING
        )
        SELECT
          script_id,
          status,
          characters_json,
          scenes_json,
          props_json,
          error_message,
          created_at,
          updated_at
        FROM episode_subjects
        WHERE script_id IN (SELECT script_id FROM owned_episode)
        LIMIT 1
      `,
      [episodeId, userId]
    );

    return mapSubjectRow(result.rows[0]);
  }

  async markProcessing(episodeId: number, userId: number): Promise<EpisodeSubjectRecord | null> {
    const result = await this.database.query<SubjectRow>(
      `
        WITH owned_episode AS (
          SELECT script_id
          FROM episodes
          WHERE script_id = $1 AND user_id = $2 AND deleted_at IS NULL
        ),
        upserted_subjects AS (
          INSERT INTO episode_subjects (
            script_id,
            status,
            characters_json,
            scenes_json,
            props_json,
            error_message,
            created_at,
            updated_at
          )
          SELECT
            script_id,
            'processing',
            '[]'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            NULL,
            NOW(),
            NOW()
          FROM owned_episode
          ON CONFLICT (script_id) DO UPDATE SET
            status = 'processing',
            characters_json = '[]'::jsonb,
            scenes_json = '[]'::jsonb,
            props_json = '[]'::jsonb,
            error_message = NULL,
            updated_at = NOW()
          RETURNING
            script_id,
            status,
            characters_json,
            scenes_json,
            props_json,
            error_message,
            created_at,
            updated_at
        )
        SELECT
          script_id,
          status,
          characters_json,
          scenes_json,
          props_json,
          error_message,
          created_at,
          updated_at
        FROM upserted_subjects
        LIMIT 1
      `,
      [episodeId, userId]
    );

    return mapSubjectRow(result.rows[0]);
  }

  async markSuccess(
    episodeId: number,
    userId: number,
    extraction: EpisodeSubjectExtractionResult
  ): Promise<EpisodeSubjectRecord | null> {
    const result = await this.database.query<SubjectRow>(
      `
        UPDATE episode_subjects AS subjects
        SET
          status = 'success',
          characters_json = $3::jsonb,
          scenes_json = $4::jsonb,
          props_json = $5::jsonb,
          error_message = NULL,
          updated_at = NOW()
        FROM episodes
        WHERE subjects.script_id = episodes.script_id
          AND episodes.script_id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
        RETURNING
          subjects.script_id,
          subjects.status,
          subjects.characters_json,
          subjects.scenes_json,
          subjects.props_json,
          subjects.error_message,
          subjects.created_at,
          subjects.updated_at
      `,
      [
        episodeId,
        userId,
        JSON.stringify(extraction.characters),
        JSON.stringify(extraction.scenes),
        JSON.stringify(extraction.props)
      ]
    );

    return mapSubjectRow(result.rows[0]);
  }

  async markFailed(episodeId: number, userId: number, errorMessage: string): Promise<EpisodeSubjectRecord | null> {
    const result = await this.database.query<SubjectRow>(
      `
        UPDATE episode_subjects AS subjects
        SET
          status = 'failed',
          error_message = $3,
          updated_at = NOW()
        FROM episodes
        WHERE subjects.script_id = episodes.script_id
          AND episodes.script_id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
        RETURNING
          subjects.script_id,
          subjects.status,
          subjects.characters_json,
          subjects.scenes_json,
          subjects.props_json,
          subjects.error_message,
          subjects.created_at,
          subjects.updated_at
      `,
      [episodeId, userId, errorMessage]
    );

    return mapSubjectRow(result.rows[0]);
  }
}

function mapSubjectRow(row: SubjectRow | undefined): EpisodeSubjectRecord | null {
  if (!row) {
    return null;
  }

  return {
    scriptId: Number(row.script_id),
    status: row.status,
    characters: readStringArray(row.characters_json),
    scenes: readStringArray(row.scenes_json),
    props: readStringArray(row.props_json),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }

  return [];
}

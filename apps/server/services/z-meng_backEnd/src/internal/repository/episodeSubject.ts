import type { Pool } from 'pg';

import type {
  EpisodeSubjectExtractionResult,
  EpisodeSubjectItemRecord,
  EpisodeSubjectRecord,
  EpisodeSubjectStatus
} from '../model/episodeSubject.js';

interface SubjectRow {
  id: string;
  script_id: string;
  status: EpisodeSubjectStatus;
  characters_json: unknown;
  scenes_json: unknown;
  props_json: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface SubjectItemRow {
  id: string;
  script_id: string;
  subject_type: 'character' | 'scene' | 'prop';
  subject_name: string;
  created_at: string;
  updated_at: string;
}

export interface EpisodeSubjectItemContext {
  id: number;
  scriptId: number;
  subjectType: 'character' | 'scene' | 'prop';
  subjectName: string;
  scriptContent: string;
  aspectRatio: string;
}

export class EpisodeSubjectRepository {
  constructor(private readonly database: Pool) {}

  // Ensures the episode has a waiting subject status row and returns the expanded subject view.
  async ensureWaitingRecord(episodeId: number, userId: number): Promise<EpisodeSubjectRecord | null> {
    await this.database.query(
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

    return this.findSubjectRecordByEpisodeIdAndUserId(episodeId, userId);
  }

  // Marks extraction as processing while keeping existing normalized subject items available.
  async markProcessing(episodeId: number, userId: number): Promise<EpisodeSubjectRecord | null> {
    await this.database.query(
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

    return this.findSubjectRecordByEpisodeIdAndUserId(episodeId, userId);
  }

  // Persists the latest extraction result into the status snapshot and the normalized subject item table.
  async markSuccess(
    episodeId: number,
    userId: number,
    extraction: EpisodeSubjectExtractionResult
  ): Promise<EpisodeSubjectRecord | null> {
    await this.database.query(
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

    await this.replaceSubjectItems(episodeId, userId, extraction);

    return this.findSubjectRecordByEpisodeIdAndUserId(episodeId, userId);
  }

  // Stores a failed extraction state while preserving the last successful subject snapshot if it exists.
  async markFailed(episodeId: number, userId: number, errorMessage: string): Promise<EpisodeSubjectRecord | null> {
    await this.database.query(
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

    return this.findSubjectRecordByEpisodeIdAndUserId(episodeId, userId);
  }

  // Loads one episode's subject status row together with all normalized subject items.
  async findSubjectRecordByEpisodeIdAndUserId(episodeId: number, userId: number): Promise<EpisodeSubjectRecord | null> {
    const [subjectResult, itemsResult] = await Promise.all([
      this.database.query<SubjectRow>(
        `
          SELECT
            subjects.id,
            subjects.script_id,
            subjects.status,
            subjects.characters_json,
            subjects.scenes_json,
            subjects.props_json,
            subjects.error_message,
            subjects.created_at,
            subjects.updated_at
          FROM episode_subjects AS subjects
          INNER JOIN episodes
            ON episodes.script_id = subjects.script_id
          WHERE episodes.script_id = $1
            AND episodes.user_id = $2
            AND episodes.deleted_at IS NULL
          LIMIT 1
        `,
        [episodeId, userId]
      ),
      this.database.query<SubjectItemRow>(
        `
          SELECT
            items.id,
            items.script_id,
            items.subject_type,
            items.subject_name,
            items.created_at,
            items.updated_at
          FROM episode_subject_items AS items
          INNER JOIN episodes
            ON episodes.script_id = items.script_id
          WHERE episodes.script_id = $1
            AND episodes.user_id = $2
            AND episodes.deleted_at IS NULL
          ORDER BY
            CASE items.subject_type
              WHEN 'character' THEN 1
              WHEN 'scene' THEN 2
              WHEN 'prop' THEN 3
              ELSE 4
            END,
            items.id ASC
        `,
        [episodeId, userId]
      )
    ]);

    return mapSubjectRow(subjectResult.rows[0], itemsResult.rows);
  }

  // Loads one normalized subject item together with the episode fields needed for image generation.
  async findSubjectItemContextByIdAndUserId(subjectItemId: number, userId: number): Promise<EpisodeSubjectItemContext | null> {
    const result = await this.database.query<{
      id: string;
      script_id: string;
      subject_type: 'character' | 'scene' | 'prop';
      subject_name: string;
      script_content: string;
      aspect_ratio: string;
    }>(
      `
        SELECT
          items.id,
          items.script_id,
          items.subject_type,
          items.subject_name,
          episodes.script_content,
          episodes.aspect_ratio
        FROM episode_subject_items AS items
        INNER JOIN episodes
          ON episodes.script_id = items.script_id
        WHERE items.id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
        LIMIT 1
      `,
      [subjectItemId, userId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      scriptId: Number(row.script_id),
      subjectType: row.subject_type,
      subjectName: row.subject_name,
      scriptContent: row.script_content,
      aspectRatio: row.aspect_ratio
    };
  }

  // Replaces the normalized subject item rows for one episode using the latest extracted subjects.
  private async replaceSubjectItems(
    episodeId: number,
    userId: number,
    extraction: EpisodeSubjectExtractionResult
  ): Promise<void> {
    const subjectItems = [
      ...extraction.characters.map((subjectName) => ({ subjectType: 'character' as const, subjectName })),
      ...extraction.scenes.map((subjectName) => ({ subjectType: 'scene' as const, subjectName })),
      ...extraction.props.map((subjectName) => ({ subjectType: 'prop' as const, subjectName }))
    ];

    for (const item of subjectItems) {
      await this.database.query(
        `
          INSERT INTO episode_subject_items (
            script_id,
            subject_type,
            subject_name,
            created_at,
            updated_at
          )
          SELECT
            episodes.script_id,
            $3,
            $4,
            NOW(),
            NOW()
          FROM episodes
          WHERE episodes.script_id = $1
            AND episodes.user_id = $2
            AND episodes.deleted_at IS NULL
          ON CONFLICT (script_id, subject_type, subject_name) DO UPDATE SET
            updated_at = NOW()
        `,
        [episodeId, userId, item.subjectType, item.subjectName]
      );
    }

    const keepNames = subjectItems.map((item) => item.subjectName);
    const keepTypes = subjectItems.map((item) => item.subjectType);

    await this.database.query(
      `
        DELETE FROM episode_subject_items AS items
        USING episodes
        WHERE items.script_id = episodes.script_id
          AND episodes.script_id = $1
          AND episodes.user_id = $2
          AND episodes.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM unnest($3::varchar[], $4::varchar[]) AS next_item(subject_name, subject_type)
            WHERE next_item.subject_name = items.subject_name
              AND next_item.subject_type = items.subject_type
          )
      `,
      [episodeId, userId, keepNames, keepTypes]
    );
  }
}

function mapSubjectRow(row: SubjectRow | undefined, itemRows: SubjectItemRow[]): EpisodeSubjectRecord | null {
  if (!row) {
    return null;
  }

  const items = itemRows.map(mapSubjectItemRow);
  const grouped = groupSubjectNames(items);

  return {
    scriptId: Number(row.script_id),
    status: row.status,
    items,
    characters: grouped.characters.length ? grouped.characters : readStringArray(row.characters_json),
    scenes: grouped.scenes.length ? grouped.scenes : readStringArray(row.scenes_json),
    props: grouped.props.length ? grouped.props : readStringArray(row.props_json),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSubjectItemRow(row: SubjectItemRow): EpisodeSubjectItemRecord {
  return {
    id: Number(row.id),
    scriptId: Number(row.script_id),
    subjectType: row.subject_type,
    subjectName: row.subject_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function groupSubjectNames(items: EpisodeSubjectItemRecord[]): {
  characters: string[];
  scenes: string[];
  props: string[];
} {
  const characters: string[] = [];
  const scenes: string[] = [];
  const props: string[] = [];

  for (const item of items) {
    if (item.subjectType === 'character') {
      characters.push(item.subjectName);
      continue;
    }

    if (item.subjectType === 'scene') {
      scenes.push(item.subjectName);
      continue;
    }

    props.push(item.subjectName);
  }

  return {
    characters,
    scenes,
    props
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

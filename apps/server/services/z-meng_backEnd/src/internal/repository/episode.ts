import type { Pool } from 'pg';
import type {
  CreateEpisodeInput,
  EpisodeAspectRatio,
  EpisodeRecord,
  EpisodeStage,
  EpisodeStyle
} from '../model/episode.js';

export type { EpisodeRecord, EpisodeStage } from '../model/episode.js';

export class EpisodeRepository {
  constructor(private readonly database: Pool) {}

  async createEpisode(input: CreateEpisodeInput): Promise<EpisodeRecord> {
    const result = await this.database.query<{
      script_id: string;
      user_id: string | null;
      username: string | null;
      episode_name: string;
      script_content: string;
      current_stage: EpisodeStage;
      style: EpisodeStyle;
      aspect_ratio: EpisodeAspectRatio;
      created_at: string;
      updated_at: string;
    }>(
      `
        WITH inserted_episode AS (
          INSERT INTO episodes (user_id, episode_name, style, aspect_ratio, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING script_id, user_id, episode_name, script_content, current_stage, style, aspect_ratio, created_at, updated_at
        )
        SELECT
          inserted_episode.script_id,
          inserted_episode.user_id,
          users.username,
          inserted_episode.episode_name,
          inserted_episode.script_content,
          inserted_episode.current_stage,
          inserted_episode.style,
          inserted_episode.aspect_ratio,
          inserted_episode.created_at,
          inserted_episode.updated_at
        FROM inserted_episode
        LEFT JOIN users ON users.id = inserted_episode.user_id
      `,
      [input.userId, input.episodeName, input.style, input.aspectRatio]
    );

    const row = result.rows[0];
    return {
      scriptId: Number(row.script_id),
      userId: row.user_id === null ? null : Number(row.user_id),
      username: row.username,
      episodeName: row.episode_name,
      scriptContent: row.script_content,
      currentStage: row.current_stage,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async listEpisodesByUserId(userId: number): Promise<EpisodeRecord[]> {
    const result = await this.database.query<{
      script_id: string;
      user_id: string | null;
      username: string | null;
      episode_name: string;
      script_content: string;
      current_stage: EpisodeStage;
      style: EpisodeStyle;
      aspect_ratio: EpisodeAspectRatio;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT
          episodes.script_id,
          episodes.user_id,
          users.username,
          episodes.episode_name,
          episodes.script_content,
          episodes.current_stage,
          episodes.style,
          episodes.aspect_ratio,
          episodes.created_at,
          episodes.updated_at
        FROM episodes
        LEFT JOIN users ON users.id = episodes.user_id
        WHERE episodes.user_id = $1 AND episodes.deleted_at IS NULL
        ORDER BY episodes.created_at DESC, episodes.script_id DESC
      `,
      [userId]
    );

    return result.rows.map((row) => ({
      scriptId: Number(row.script_id),
      userId: row.user_id === null ? null : Number(row.user_id),
      username: row.username,
      episodeName: row.episode_name,
      scriptContent: row.script_content,
      currentStage: row.current_stage,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async updateEpisodeScriptContent(
    episodeId: number,
    userId: number,
    scriptContent: string,
    nextStage?: EpisodeStage
  ): Promise<EpisodeRecord | null> {
    const result = await this.database.query<{
      script_id: string;
      user_id: string | null;
      username: string | null;
      episode_name: string;
      script_content: string;
      current_stage: EpisodeStage;
      style: EpisodeStyle;
      aspect_ratio: EpisodeAspectRatio;
      created_at: string;
      updated_at: string;
    }>(
      `
        WITH updated_episode AS (
          UPDATE episodes
          SET
            script_content = $3,
            current_stage = COALESCE($4, current_stage),
            updated_at = NOW()
          WHERE script_id = $1 AND user_id = $2 AND deleted_at IS NULL
          RETURNING script_id, user_id, episode_name, script_content, current_stage, style, aspect_ratio, created_at, updated_at
        )
        SELECT
          updated_episode.script_id,
          updated_episode.user_id,
          users.username,
          updated_episode.episode_name,
          updated_episode.script_content,
          updated_episode.current_stage,
          updated_episode.style,
          updated_episode.aspect_ratio,
          updated_episode.created_at,
          updated_episode.updated_at
        FROM updated_episode
        LEFT JOIN users ON users.id = updated_episode.user_id
      `,
      [episodeId, userId, scriptContent, nextStage ?? null]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      scriptId: Number(row.script_id),
      userId: row.user_id === null ? null : Number(row.user_id),
      username: row.username,
      episodeName: row.episode_name,
      scriptContent: row.script_content,
      currentStage: row.current_stage,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async updateEpisodeCurrentStage(episodeId: number, userId: number, currentStage: EpisodeStage): Promise<EpisodeRecord | null> {
    const result = await this.database.query<{
      script_id: string;
      user_id: string | null;
      username: string | null;
      episode_name: string;
      script_content: string;
      current_stage: EpisodeStage;
      style: EpisodeStyle;
      aspect_ratio: EpisodeAspectRatio;
      created_at: string;
      updated_at: string;
    }>(
      `
        WITH updated_episode AS (
          UPDATE episodes
          SET current_stage = $3, updated_at = NOW()
          WHERE script_id = $1 AND user_id = $2 AND deleted_at IS NULL
          RETURNING script_id, user_id, episode_name, script_content, current_stage, style, aspect_ratio, created_at, updated_at
        )
        SELECT
          updated_episode.script_id,
          updated_episode.user_id,
          users.username,
          updated_episode.episode_name,
          updated_episode.script_content,
          updated_episode.current_stage,
          updated_episode.style,
          updated_episode.aspect_ratio,
          updated_episode.created_at,
          updated_episode.updated_at
        FROM updated_episode
        LEFT JOIN users ON users.id = updated_episode.user_id
      `,
      [episodeId, userId, currentStage]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      scriptId: Number(row.script_id),
      userId: row.user_id === null ? null : Number(row.user_id),
      username: row.username,
      episodeName: row.episode_name,
      scriptContent: row.script_content,
      currentStage: row.current_stage,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

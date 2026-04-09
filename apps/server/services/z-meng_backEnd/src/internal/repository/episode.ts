import type { Pool } from 'pg';

export interface EpisodeRecord {
  scriptId: number;
  userId: number | null;
  username: string | null;
  episodeName: string;
  scriptContent: string;
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  updatedAt: string;
}

interface CreateEpisodeInput {
  userId: number;
  episodeName: string;
  scriptContent: string;
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export class EpisodeRepository {
  constructor(private readonly database: Pool) {}

  async createEpisode(input: CreateEpisodeInput): Promise<EpisodeRecord> {
    const result = await this.database.query<{
      script_id: string;
      user_id: string | null;
      username: string | null;
      episode_name: string;
      script_content: string;
      style: '动漫' | '真人';
      aspect_ratio: '16:9' | '9:16' | '1:1';
      created_at: string;
      updated_at: string;
    }>(
      `
        WITH inserted_episode AS (
          INSERT INTO episodes (user_id, episode_name, script_content, style, aspect_ratio, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING script_id, user_id, episode_name, script_content, style, aspect_ratio, created_at, updated_at
        )
        SELECT
          inserted_episode.script_id,
          inserted_episode.user_id,
          users.username,
          inserted_episode.episode_name,
          inserted_episode.script_content,
          inserted_episode.style,
          inserted_episode.aspect_ratio,
          inserted_episode.created_at,
          inserted_episode.updated_at
        FROM inserted_episode
        LEFT JOIN users ON users.id = inserted_episode.user_id
      `,
      [input.userId, input.episodeName, input.scriptContent, input.style, input.aspectRatio]
    );

    const row = result.rows[0];
    return {
      scriptId: Number(row.script_id),
      userId: row.user_id === null ? null : Number(row.user_id),
      username: row.username,
      episodeName: row.episode_name,
      scriptContent: row.script_content,
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
      style: '动漫' | '真人';
      aspect_ratio: '16:9' | '9:16' | '1:1';
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
      style: row.style,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}

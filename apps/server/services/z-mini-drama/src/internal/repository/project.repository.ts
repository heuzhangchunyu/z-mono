import type { Pool, PoolClient } from 'pg';
import type { CreateProjectInput, ProjectRecord, ProjectStatus } from '../model/project.js';

interface ProjectRow {
  id: number | string;
  name: string;
  description: string;
  status: ProjectStatus;
  aspect_ratio: string | null;
  global_art_style: string | null;
  visual_asset_description: unknown[] | string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ProjectListResult {
  items: ProjectRecord[];
  total: number;
}

export class ProjectRepository {
  constructor(private readonly pool: Pool) {}

  async createProject(input: CreateProjectInput, userId: number) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const createdProject = await insertProject(client, input);
      await client.query(
        `INSERT INTO user_projects (user_id, project_id)
         VALUES ($1, $2)`,
        [userId, createdProject.id]
      );

      await client.query('COMMIT');
      return createdProject;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listProjects(params: ListProjectsParams): Promise<ProjectListResult> {
    const whereClauses: string[] = ['projects.deleted_at IS NULL'];
    const values: Array<number | string> = [];

    if (params.userRole !== 'admin') {
      values.push(params.userId);
      whereClauses.push(`EXISTS (
        SELECT 1
        FROM user_projects
        WHERE user_projects.project_id = projects.id
          AND user_projects.user_id = $${values.length}
      )`);
    }

    if (params.name) {
      values.push(`%${params.name}%`);
      whereClauses.push(`projects.name ILIKE $${values.length}`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM projects
       ${whereSql}`,
      values
    );

    const offset = (params.page - 1) * params.pageSize;
    const listValues = [...values, params.pageSize, offset];
    const itemsResult = await this.pool.query<ProjectRow>(
      `SELECT projects.id,
              projects.name,
              projects.description,
              projects.status,
              projects.aspect_ratio,
              projects.global_art_style,
              projects.visual_asset_description,
              projects.created_at,
              projects.updated_at,
              projects.deleted_at
         FROM projects
         ${whereSql}
        ORDER BY projects.created_at DESC
        LIMIT $${values.length + 1}
       OFFSET $${values.length + 2}`,
      listValues
    );

    return {
      items: itemsResult.rows.map(mapProjectRecord),
      total: parseCount(countResult.rows[0]?.total)
    };
  }
}

interface ListProjectsParams {
  userId: number;
  userRole: string;
  page: number;
  pageSize: number;
  name: string;
}

async function insertProject(client: PoolClient, input: CreateProjectInput) {
  const result = await client.query<ProjectRow>(
    `INSERT INTO projects (name, description, status, aspect_ratio, global_art_style, visual_asset_description)
     VALUES ($1, $2, 'draft', $3, $4, '[]'::jsonb)
     RETURNING id,
               name,
               description,
               status,
               aspect_ratio,
               global_art_style,
               visual_asset_description,
               created_at,
               updated_at,
               deleted_at`,
    [input.name, input.description, input.aspectRatio, input.globalArtStyle]
  );

  return mapProjectRecord(result.rows[0]);
}

function mapProjectRecord(row: ProjectRow): ProjectRecord {
  return {
    id: parseEntityId(row.id, 'project'),
    name: row.name,
    description: row.description,
    status: row.status,
    aspectRatio: row.aspect_ratio,
    globalArtStyle: row.global_art_style,
    visualAssetDescription: parseVisualAssetDescription(row.visual_asset_description),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function parseEntityId(rawId: number | string, entityName: string) {
  const parsedId = typeof rawId === 'number' ? rawId : Number(rawId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error(`Invalid ${entityName} id: ${rawId}`);
  }

  return parsedId;
}

function parseCount(rawValue: string | undefined) {
  const parsedValue = Number(rawValue ?? '0');
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function parseVisualAssetDescription(rawValue: ProjectRow['visual_asset_description']) {
  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    try {
      const parsedValue = JSON.parse(rawValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
      return [];
    }
  }

  return [];
}

import type { Pool } from 'pg';
import type { CreateUserInput, UserRecord } from '../model/user.js';

export type { UserRecord } from '../model/user.js';

export class UserRepository {
  constructor(private readonly database: Pool) {}

  async findById(id: number): Promise<UserRecord | null> {
    const result = await this.database.query<{
      id: string;
      username: string;
      password_hash: string;
      display_name: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT id, username, password_hash, display_name, role, is_active, created_at, updated_at
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      username: row.username,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const result = await this.database.query<{
      id: string;
      username: string;
      password_hash: string;
      display_name: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `
        SELECT id, username, password_hash, display_name, role, is_active, created_at, updated_at
        FROM users
        WHERE username = $1 AND deleted_at IS NULL
        LIMIT 1
      `,
      [username]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      username: row.username,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const result = await this.database.query<{
      id: string;
      username: string;
      password_hash: string;
      display_name: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `
        INSERT INTO users (username, password_hash, display_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'user', TRUE, NOW(), NOW())
        RETURNING id, username, password_hash, display_name, role, is_active, created_at, updated_at
      `,
      [input.username, input.passwordHash, input.displayName ?? null]
    );

    const row = result.rows[0];
    return {
      id: Number(row.id),
      username: row.username,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

import type { Pool } from 'pg';
import type { UserRecord } from '../model/user.js';

interface UserRow {
  id: number | string;
  username: string;
  password_hash: string;
  nickname: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByUsername(username: string) {
    const result = await this.pool.query<UserRow>(
      `SELECT id,
              username,
              password_hash,
              nickname,
              role,
              is_active,
              created_at,
              updated_at
         FROM users
        WHERE BTRIM(username) = $1
        LIMIT 1`,
      [username.trim()]
    );

    return result.rows[0] ? mapUserRecord(result.rows[0]) : null;
  }

  async findById(id: number) {
    const result = await this.pool.query<UserRow>(
      `SELECT id,
              username,
              password_hash,
              nickname,
              role,
              is_active,
              created_at,
              updated_at
         FROM users
        WHERE id = $1
        LIMIT 1`,
      [id]
    );

    return result.rows[0] ? mapUserRecord(result.rows[0]) : null;
  }

  async createUser(input: CreateUserInput) {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (username, password_hash, nickname, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id,
                 username,
                 password_hash,
                 nickname,
                 role,
                 is_active,
                 created_at,
                 updated_at`,
      [input.username, input.passwordHash, input.nickname, input.role, input.isActive]
    );

    return mapUserRecord(result.rows[0]);
  }
}

export interface CreateUserInput {
  username: string;
  passwordHash: string;
  nickname: string;
  role: string;
  isActive: boolean;
}

function mapUserRecord(row: UserRow): UserRecord {
  return {
    id: parseUserId(row.id),
    username: row.username,
    passwordHash: row.password_hash,
    nickname: row.nickname,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseUserId(rawUserId: number | string) {
  const parsedUserId = typeof rawUserId === 'number' ? rawUserId : Number(rawUserId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    throw new Error(`Invalid user id: ${rawUserId}`);
  }

  return parsedUserId;
}

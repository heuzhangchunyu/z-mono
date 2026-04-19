import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Pool, PoolClient } from 'pg';

interface MigrationPair {
  version: number;
  name: string;
  upSql: string;
  downSql: string;
  prevVersion: number;
}

interface AppliedMigration {
  version: string;
}

const SCHEMA_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations
(
  version BIGINT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const SCHEMA_DDLS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_ddls
(
  version BIGINT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  up TEXT NOT NULL DEFAULT '',
  down TEXT NOT NULL DEFAULT '',
  prev_version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function runMigrations(pool: Pool) {
  await ensureMigrationTables(pool);

  const migrations = await loadMigrationPairs();
  if (migrations.length === 0) {
    return;
  }

  await saveMigrationDefinitions(pool, migrations);

  const appliedVersions = await loadAppliedVersions(pool);
  const pendingMigrations = migrations.filter((migration) => !appliedVersions.has(migration.version));

  for (const migration of pendingMigrations) {
    await applyMigration(pool, migration);
  }
}

async function ensureMigrationTables(pool: Pool) {
  await pool.query(SCHEMA_MIGRATIONS_TABLE_SQL);
  await pool.query(SCHEMA_DDLS_TABLE_SQL);
}

async function loadMigrationPairs() {
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const fileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const upFileNames = fileNames.filter((fileName) => fileName.endsWith('.up.sql'));

  const migrations: MigrationPair[] = [];
  let prevVersion = 0;

  for (const upFileName of upFileNames) {
    const baseName = upFileName.replace(/\.up\.sql$/, '');
    const downFileName = `${baseName}.down.sql`;

    if (!fileNames.includes(downFileName)) {
      throw new Error(`Missing down migration for ${upFileName}`);
    }

    const separatorIndex = baseName.indexOf('_');
    if (separatorIndex === -1) {
      throw new Error(`Invalid migration file name: ${upFileName}`);
    }

    const version = Number(baseName.slice(0, separatorIndex));
    if (Number.isNaN(version)) {
      throw new Error(`Invalid migration version in file: ${upFileName}`);
    }

    const name = baseName.slice(separatorIndex + 1);
    const [upSql, downSql] = await Promise.all([
      readFile(path.join(migrationsDir, upFileName), 'utf8'),
      readFile(path.join(migrationsDir, downFileName), 'utf8')
    ]);

    migrations.push({
      version,
      name,
      upSql,
      downSql,
      prevVersion
    });

    prevVersion = version;
  }

  return migrations;
}

async function saveMigrationDefinitions(pool: Pool, migrations: MigrationPair[]) {
  for (const migration of migrations) {
    await pool.query(
      `INSERT INTO schema_ddls (version, name, up, down, prev_version)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (version) DO UPDATE
       SET name = EXCLUDED.name,
           up = EXCLUDED.up,
           down = EXCLUDED.down,
           prev_version = EXCLUDED.prev_version`,
      [migration.version, migration.name, migration.upSql, migration.downSql, migration.prevVersion]
    );
  }
}

async function loadAppliedVersions(pool: Pool) {
  const result = await pool.query<AppliedMigration>('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((row) => Number(row.version)));
}

async function applyMigration(pool: Pool, migration: MigrationPair) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(migration.upSql);
    await client.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
      [migration.version, migration.name]
    );
    await client.query('COMMIT');
  } catch (error) {
    await rollbackMigration(client);
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackMigration(client: PoolClient) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Best effort rollback to keep startup path simple.
  }
}

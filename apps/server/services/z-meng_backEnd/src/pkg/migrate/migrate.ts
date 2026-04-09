import fs from 'node:fs/promises';
import path from 'node:path';

import { Pool, type PoolClient } from 'pg';

interface SchemaDDL {
  version: number;
  up: string;
  down: string;
  prevVersion: number;
}

interface MigrationState {
  version: number;
  dirty: boolean;
}

type MigrationTarget = 'auto' | 'autoup' | 'down' | string;

const TARGET_AUTO = 'auto';
const TARGET_AUTOUP = 'autoup';

export async function migrateDatabase(
  connectionString: string,
  migrationsDir: string,
  target: MigrationTarget
): Promise<void> {
  if (!target) {
    return;
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await ensureMigrationTables(client);
    const state = await getMigrationState(client);
    await saveMigrations(client, migrationsDir, state.version);

    if (state.dirty) {
      throw new Error(`Dirty migration state detected at version ${state.version}`);
    }

    const schemaDDLs = await loadSchemaDDLs(client);
    const localVersion = getLatestLocalVersion(schemaDDLs);
    const resolvedTarget = resolveTargetVersion(target, state.version, localVersion, schemaDDLs);

    if (resolvedTarget === state.version) {
      return;
    }

    if (resolvedTarget > state.version) {
      await applyUpMigrations(client, schemaDDLs, state.version, resolvedTarget);
    } else {
      await applyDownMigrations(client, schemaDDLs, state.version, resolvedTarget);
    }

    await cleanupSchemaDDLs(client, resolvedTarget);
  } finally {
    client.release();
    await pool.end();
  }
}

async function ensureMigrationTables(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_ddls (
      version BIGINT PRIMARY KEY NOT NULL,
      up TEXT NOT NULL DEFAULT '',
      down TEXT NOT NULL DEFAULT '',
      prev_version BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SMALLINT PRIMARY KEY NOT NULL DEFAULT 1 CHECK (id = 1),
      version BIGINT NOT NULL DEFAULT 0,
      dirty BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    INSERT INTO schema_migrations (id, version, dirty)
    VALUES (1, 0, FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function saveMigrations(
  client: PoolClient,
  migrationsDir: string,
  appliedVersion: number
): Promise<void> {
  const localMigrations = await loadLocalMigrations(migrationsDir);
  const existing = await client.query<{
    version: string;
    up: string;
    down: string;
    prev_version: string;
  }>(
    `
      SELECT version, up, down, prev_version
      FROM schema_ddls
    `
  );
  const existingByVersion = new Map(
    existing.rows.map((row) => [
      Number(row.version),
      {
        up: row.up,
        down: row.down,
        prevVersion: Number(row.prev_version)
      }
    ])
  );

  let previousVersion = 0;
  for (const migration of localMigrations) {
    const existingMigration = existingByVersion.get(migration.version);
    if (existingMigration) {
      if (
        migration.version > appliedVersion &&
        (existingMigration.up !== migration.up ||
          existingMigration.down !== migration.down ||
          existingMigration.prevVersion !== previousVersion)
      ) {
        await client.query(
          `
            UPDATE schema_ddls
            SET up = $2, down = $3, prev_version = $4
            WHERE version = $1
          `,
          [migration.version, migration.up, migration.down, previousVersion]
        );
      }

      previousVersion = migration.version;
      continue;
    }

    await client.query(
      `
        INSERT INTO schema_ddls (version, up, down, prev_version)
        VALUES ($1, $2, $3, $4)
      `,
      [migration.version, migration.up, migration.down, previousVersion]
    );

    previousVersion = migration.version;
  }
}

async function loadLocalMigrations(migrationsDir: string): Promise<SchemaDDL[]> {
  const entries = await fs.readdir(migrationsDir);
  const fileNames = entries.filter((entry) => entry.endsWith('.sql')).sort();

  if (fileNames.length % 2 !== 0) {
    throw new Error('Migration files must be paired as up/down SQL files.');
  }

  const migrations: SchemaDDL[] = [];
  let previousVersion = 0;

  for (let index = 0; index < fileNames.length; index += 2) {
    const firstFile = fileNames[index];
    const secondFile = fileNames[index + 1];
    const firstVersion = parseVersion(firstFile);
    const secondVersion = parseVersion(secondFile);

    if (firstVersion !== secondVersion) {
      throw new Error(`Migration files version mismatch: ${firstFile} vs ${secondFile}`);
    }

    const filePair = [firstFile, secondFile];
    let up = '';
    let down = '';

    for (const fileName of filePair) {
      const content = await fs.readFile(path.join(migrationsDir, fileName), 'utf8');
      if (fileName.endsWith('.up.sql')) {
        up = content;
      } else if (fileName.endsWith('.down.sql')) {
        down = content;
      } else {
        throw new Error(`Unexpected migration file direction: ${fileName}`);
      }
    }

    migrations.push({
      version: firstVersion,
      up,
      down,
      prevVersion: previousVersion
    });

    previousVersion = firstVersion;
  }

  return migrations;
}

async function loadSchemaDDLs(client: PoolClient): Promise<SchemaDDL[]> {
  const result = await client.query<{
    version: string;
    up: string;
    down: string;
    prev_version: string;
  }>(
    `
      SELECT version, up, down, prev_version
      FROM schema_ddls
      ORDER BY version ASC
    `
  );

  return result.rows.map((row: { version: string; up: string; down: string; prev_version: string }) => ({
    version: Number(row.version),
    up: row.up,
    down: row.down,
    prevVersion: Number(row.prev_version)
  }));
}

async function getMigrationState(client: PoolClient): Promise<MigrationState> {
  const result = await client.query<{ version: string; dirty: boolean }>(
    `
      SELECT version, dirty
      FROM schema_migrations
      WHERE id = 1
    `
  );

  const row = result.rows[0];
  return {
    version: Number(row?.version ?? 0),
    dirty: row?.dirty ?? false
  };
}

function getLatestLocalVersion(migrations: SchemaDDL[]): number {
  return migrations.at(-1)?.version ?? 0;
}

function resolveTargetVersion(
  target: MigrationTarget,
  remoteVersion: number,
  localVersion: number,
  migrations: SchemaDDL[]
): number {
  if (target === TARGET_AUTO || target === TARGET_AUTOUP) {
    if (localVersion === remoteVersion) {
      return remoteVersion;
    }

    if (localVersion < remoteVersion && target === TARGET_AUTOUP) {
      return remoteVersion;
    }

    return localVersion;
  }

  if (target === 'down') {
    return resolveStepsTarget(remoteVersion, -1, migrations);
  }

  if (target.startsWith('+') || target.startsWith('-')) {
    return resolveStepsTarget(remoteVersion, Number(target), migrations);
  }

  const explicitVersion = Number(target);
  if (!Number.isInteger(explicitVersion) || explicitVersion < 0) {
    throw new Error(`Invalid migration target: ${target}`);
  }

  if (explicitVersion !== 0 && !migrations.some((migration) => migration.version === explicitVersion)) {
    throw new Error(`Unknown migration version: ${explicitVersion}`);
  }

  return explicitVersion;
}

function resolveStepsTarget(currentVersion: number, steps: number, migrations: SchemaDDL[]): number {
  const versionChain = [0, ...migrations.map((migration) => migration.version)];
  const currentIndex = versionChain.indexOf(currentVersion);

  if (currentIndex === -1) {
    throw new Error(`Current migration version ${currentVersion} is not present in schema_ddls.`);
  }

  const nextIndex = Math.min(Math.max(currentIndex + steps, 0), versionChain.length - 1);
  return versionChain[nextIndex];
}

async function applyUpMigrations(
  client: PoolClient,
  migrations: SchemaDDL[],
  currentVersion: number,
  targetVersion: number
): Promise<void> {
  for (const migration of migrations) {
    if (migration.version <= currentVersion || migration.version > targetVersion) {
      continue;
    }

    await markMigrationDirty(client, currentVersion, true);
    await client.query(migration.up);
    await markMigrationDirty(client, migration.version, false);
    currentVersion = migration.version;
  }
}

async function applyDownMigrations(
  client: PoolClient,
  migrations: SchemaDDL[],
  currentVersion: number,
  targetVersion: number
): Promise<void> {
  const descending = [...migrations].sort((left, right) => right.version - left.version);

  for (const migration of descending) {
    if (migration.version > currentVersion || migration.version <= targetVersion) {
      continue;
    }

    await markMigrationDirty(client, currentVersion, true);
    await client.query(migration.down);
    await markMigrationDirty(client, migration.prevVersion, false);
    currentVersion = migration.prevVersion;
  }
}

async function markMigrationDirty(client: PoolClient, version: number, dirty: boolean): Promise<void> {
  await client.query(
    `
      UPDATE schema_migrations
      SET version = $1, dirty = $2, updated_at = NOW()
      WHERE id = 1
    `,
    [version, dirty]
  );
}

async function cleanupSchemaDDLs(client: PoolClient, currentVersion: number): Promise<void> {
  await client.query('DELETE FROM schema_ddls WHERE version > $1', [currentVersion]);
}

function parseVersion(fileName: string): number {
  const [versionPart] = fileName.split('_');
  const version = Number(versionPart);

  if (!Number.isInteger(version)) {
    throw new Error(`Invalid migration version in file name: ${fileName}`);
  }

  return version;
}

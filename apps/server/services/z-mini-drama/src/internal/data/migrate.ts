import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

export const TargetAuto = 'auto';
export const TargetAutoup = 'autoup';

interface MigrationPair {
  version: number;
  name: string;
  upSql: string;
  downSql: string;
  prevVersion: number;
}

interface SchemaDDLRow {
  version: string;
  up: string;
  down: string;
  prev_version: string;
}

interface RemoteMigrationStateRow {
  version: string;
  dirty: boolean;
}

interface RemoteMigrationState {
  version: number;
  dirty: boolean;
}

const SCHEMA_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations
(
  version BIGINT PRIMARY KEY NOT NULL,
  dirty BOOLEAN NOT NULL DEFAULT FALSE
);
`;

const SCHEMA_DDLS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_ddls
(
  version BIGINT PRIMARY KEY NOT NULL,
  up TEXT NOT NULL DEFAULT '',
  down TEXT NOT NULL DEFAULT '',
  prev_version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function migrate(connStr: string, migrationsDir: string, target: string) {
  if (!target) {
    return;
  }

  const pool = new Pool({
    connectionString: connStr
  });

  try {
    await ensureMigrationTables(pool);
    await normalizeLegacySchemaMigrations(pool, migrationsDir);
    await saveMigrations(pool, migrationsDir);
    await migrateToTarget(pool, migrationsDir, target);
    await cleanupSchemaDDLs(pool);
  } finally {
    await pool.end();
  }
}

async function ensureMigrationTables(pool: Pool) {
  await pool.query(SCHEMA_MIGRATIONS_TABLE_SQL);
  await pool.query('ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS dirty BOOLEAN NOT NULL DEFAULT FALSE');
  await pool.query(SCHEMA_DDLS_TABLE_SQL);
}

async function migrateToTarget(pool: Pool, migrationsDir: string, target: string) {
  const normalizedTarget = target === 'down' ? '-1' : target;

  if (normalizedTarget === TargetAuto || normalizedTarget === TargetAutoup) {
    const localVersion = await getLocalVersion(migrationsDir);
    const remoteState = await getRemoteMigrationState(pool);

    if (localVersion === remoteState.version) {
      return;
    }

    if (localVersion < remoteState.version && normalizedTarget === TargetAutoup) {
      return;
    }

    await migrateToVersion(pool, localVersion);
    return;
  }

  const parsedTarget = parseTarget(normalizedTarget);
  if (parsedTarget.steps !== 0) {
    await migrateBySteps(pool, parsedTarget.steps);
    return;
  }

  await migrateToVersion(pool, parsedTarget.version);
}

async function migrateToVersion(pool: Pool, targetVersion: number) {
  const state = await getRemoteMigrationState(pool);
  if (state.dirty) {
    throw new Error(`Dirty migration state detected at version ${state.version}`);
  }

  const migrations = await loadSchemaDDLs(pool);
  if (targetVersion > 0 && !migrations.some((migration) => migration.version === targetVersion)) {
    throw new Error(`Migration version ${targetVersion} not found`);
  }

  if (targetVersion === state.version) {
    return;
  }

  if (targetVersion > state.version) {
    const pendingMigrations = migrations.filter((migration) => migration.version > state.version && migration.version <= targetVersion);

    for (const migration of pendingMigrations) {
      await applyUpMigration(pool, migration);
    }

    return;
  }

  const rollbackMigrations = migrations
    .filter((migration) => migration.version <= state.version && migration.version > targetVersion)
    .sort((left, right) => right.version - left.version);

  for (const migration of rollbackMigrations) {
    await applyDownMigration(pool, migration);
  }
}

async function migrateBySteps(pool: Pool, steps: number) {
  if (steps === 0) {
    return;
  }

  const state = await getRemoteMigrationState(pool);
  if (state.dirty) {
    throw new Error(`Dirty migration state detected at version ${state.version}`);
  }

  const migrations = await loadSchemaDDLs(pool);

  if (steps > 0) {
    const nextMigrations = migrations
      .filter((migration) => migration.version > state.version)
      .slice(0, steps);

    for (const migration of nextMigrations) {
      await applyUpMigration(pool, migration);
    }

    return;
  }

  const rollbackMigrations = migrations
    .filter((migration) => migration.version <= state.version)
    .sort((left, right) => right.version - left.version)
    .slice(0, Math.abs(steps));

  for (const migration of rollbackMigrations) {
    await applyDownMigration(pool, migration);
  }
}

async function applyUpMigration(pool: Pool, migration: MigrationPair) {
  await setRemoteMigrationState(pool, {
    version: migration.version,
    dirty: true
  });

  await pool.query(migration.upSql);

  await setRemoteMigrationState(pool, {
    version: migration.version,
    dirty: false
  });
}

async function applyDownMigration(pool: Pool, migration: MigrationPair) {
  await setRemoteMigrationState(pool, {
    version: migration.version,
    dirty: true
  });

  await pool.query(migration.downSql);

  if (migration.prevVersion === 0) {
    await clearRemoteMigrationState(pool);
    return;
  }

  await setRemoteMigrationState(pool, {
    version: migration.prevVersion,
    dirty: false
  });
}

async function saveMigrations(pool: Pool, migrationsDir: string) {
  const remoteVersions = await loadSavedMigrationVersions(pool);
  const localMigrations = await loadMigrationPairs(migrationsDir);

  for (const migration of localMigrations) {
    if (remoteVersions.has(migration.version)) {
      continue;
    }

    await pool.query(
      `INSERT INTO schema_ddls (version, up, down, prev_version)
       VALUES ($1, $2, $3, $4)`,
      [migration.version, migration.upSql, migration.downSql, migration.prevVersion]
    );
  }
}

async function loadSavedMigrationVersions(pool: Pool) {
  const result = await pool.query<{ version: string }>('SELECT version FROM schema_ddls');
  return new Set(result.rows.map((row) => Number(row.version)));
}

async function getLocalVersion(migrationsDir: string) {
  const migrations = await loadMigrationPairs(migrationsDir);
  return migrations.length === 0 ? 0 : migrations[migrations.length - 1].version;
}

async function loadMigrationPairs(migrationsDir: string) {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
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

async function loadSchemaDDLs(pool: Pool) {
  const result = await pool.query<SchemaDDLRow>(
    `SELECT version, up, down, prev_version
       FROM schema_ddls
      ORDER BY version ASC`
  );

  return result.rows.map((row) => ({
    version: Number(row.version),
    name: '',
    upSql: row.up,
    downSql: row.down,
    prevVersion: Number(row.prev_version)
  } satisfies MigrationPair));
}

async function getRemoteMigrationState(pool: Pool): Promise<RemoteMigrationState> {
  const result = await pool.query<RemoteMigrationStateRow>(
    `SELECT version, dirty
       FROM schema_migrations
      ORDER BY version DESC
      LIMIT 1`
  );

  if (result.rows.length === 0) {
    return {
      version: 0,
      dirty: false
    };
  }

  return {
    version: Number(result.rows[0].version),
    dirty: result.rows[0].dirty
  };
}

async function setRemoteMigrationState(pool: Pool, state: RemoteMigrationState) {
  await pool.query('DELETE FROM schema_migrations');
  await pool.query(
    `INSERT INTO schema_migrations (version, dirty)
     VALUES ($1, $2)`,
    [state.version, state.dirty]
  );
}

async function clearRemoteMigrationState(pool: Pool) {
  await pool.query('DELETE FROM schema_migrations');
}

async function cleanupSchemaDDLs(pool: Pool) {
  const state = await getRemoteMigrationState(pool);

  if (state.dirty) {
    await pool.query('DELETE FROM schema_ddls WHERE version >= $1', [state.version]);
    return;
  }

  await pool.query('DELETE FROM schema_ddls WHERE version > $1', [state.version]);
}

async function normalizeLegacySchemaMigrations(pool: Pool, migrationsDir: string) {
  const columnsResult = await pool.query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_name = 'schema_migrations'`
  );
  const columnNames = new Set(columnsResult.rows.map((row) => row.column_name));
  const usesLegacyColumns = columnNames.has('name') || columnNames.has('applied_at');

  if (!usesLegacyColumns) {
    return;
  }

  const currentState = await getRemoteMigrationState(pool);
  const localVersion = await getLocalVersion(migrationsDir);
  const normalizedVersion = localVersion > 0 ? Math.min(currentState.version, localVersion) : currentState.version;

  await clearRemoteMigrationState(pool);

  if (normalizedVersion > 0) {
    await setRemoteMigrationState(pool, {
      version: normalizedVersion,
      dirty: false
    });
  }
}

function parseTarget(target: string) {
  if (target.startsWith('+') || target.startsWith('-')) {
    const steps = Number(target);
    if (Number.isNaN(steps)) {
      throw new Error(`Invalid migration steps target: ${target}`);
    }

    return {
      steps,
      version: 0
    };
  }

  const version = Number(target);
  if (Number.isNaN(version)) {
    throw new Error(`Invalid migration version target: ${target}`);
  }

  return {
    steps: 0,
    version
  };
}

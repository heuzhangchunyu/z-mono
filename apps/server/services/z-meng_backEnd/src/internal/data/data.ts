import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { migrateDatabase } from '../../pkg/migrate/migrate.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(moduleDir, './migrations/autogen');

export function migrate(connStr: string, target: string): Promise<void> {
  return migrateDatabase(connStr, migrationsDir, target);
}

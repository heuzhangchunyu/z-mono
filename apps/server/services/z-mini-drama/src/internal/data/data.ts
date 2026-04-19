import path from 'node:path';
import { migrate } from './migrate.js';

export function Migrate(connStr: string, target: string) {
  return migrate(connStr, path.resolve(process.cwd(), 'src/internal/data/migrations/autogen'), target);
}

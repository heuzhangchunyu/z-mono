import { buildPostgresConnectionString, loadConfig } from '../internal/config/config.js';
import { migrate } from '../internal/data/data.js';

async function main(): Promise<void> {
  const { configPath, version } = parseArgs(process.argv.slice(2));

  if (!version) {
    throw new Error('A migration version is required. Example: pnpm migdown --version 2026040601');
  }

  const config = loadConfig(configPath);
  await migrate(buildPostgresConnectionString(config.database), version);
  console.log(`Database migration rolled back to version ${version}.`);
}

function parseArgs(args: string[]): { configPath?: string; version?: string } {
  let configPath: string | undefined;
  let version: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--config') {
      configPath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--version') {
      version = args[index + 1];
      index += 1;
      continue;
    }

    if (!version) {
      version = arg;
    }
  }

  return { configPath, version };
}

main().catch((error: unknown) => {
  console.error('Failed to run database rollback.', error);
  process.exit(1);
});

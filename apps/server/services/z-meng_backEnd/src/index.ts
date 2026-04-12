import { createDependencies, disposeDependencies } from './internal/bootstrap/dependencies.js';
import { buildPostgresConnectionString, loadConfig } from './internal/config/config.js';
import { migrate } from './internal/data/data.js';
import { createApp } from './internal/http/app.js';

async function main(): Promise<void> {
  const configPath = parseConfigPath(process.argv.slice(2));
  const config = loadConfig(configPath);
  const connectionString = buildPostgresConnectionString(config.database);

  await migrate(connectionString, config.runtime.migrationTarget);

  const dependencies = await createDependencies(config);
  const app = createApp({
    config,
    dependencies
  });

  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(`z-meng backend listening on http://${config.server.host}:${config.server.port}`);
  });

  const shutdown = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await disposeDependencies(dependencies);
  };

  process.on('SIGINT', () => {
    shutdown()
      .finally(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    shutdown()
      .finally(() => process.exit(0));
  });
}

function parseConfigPath(args: string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--config') {
      return args[index + 1];
    }
  }
  return undefined;
}

main().catch((error: unknown) => {
  console.error('Failed to start z-meng backend.', error);
  process.exit(1);
});

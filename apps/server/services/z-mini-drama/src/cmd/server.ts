import { createServerApp } from '../internal/api/app.js';
import { loadAppConfig } from '../internal/config/env.js';

const appConfig = loadAppConfig();
const app = createServerApp(appConfig);

app.listen(appConfig.port, () => {
  console.log(`z-mini-drama backend listening on http://127.0.0.1:${appConfig.port}`);
});

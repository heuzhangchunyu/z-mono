# z-mono

A Turbo monorepo starter with a React frontend workspace and a Koa backend workspace.

## Structure

- `apps/web/app/*`: multiple frontend applications
- `apps/web/packages/*`: reusable and publishable frontend packages
- `apps/server/services/*`: multiple backend services

## Notable Projects

- `apps/web/app/main`: default frontend starter
- `apps/web/app/coNote_frontEnd`: notebook frontend project
- `apps/server/services/main`: default backend service
- `apps/server/services/coNote_backEnd`: notebook backend service

## Scripts

- `pnpm install`: install all workspace dependencies
- `pnpm dev`: start workspace development tasks through Turbo
- `pnpm dev:main`: start the main frontend app in `apps/web/app/main`
- `pnpm dev:conote:frontend`: start `apps/web/app/coNote_frontEnd`
- `pnpm dev:conote:backend`: start `apps/server/services/coNote_backEnd`
- `pnpm dev:server`: start the main backend service in `apps/server/services/main`
- `pnpm build`: build all apps and packages that define a build task

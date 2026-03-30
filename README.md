# z-mono

A Turbo monorepo starter with a React frontend workspace and a Koa backend.

## Structure

- `apps/web/app/*`: multiple frontend applications
- `apps/web/packages/*`: reusable and publishable frontend packages
- `apps/server`: Koa backend API server

## Scripts

- `pnpm install`: install all workspace dependencies
- `pnpm dev`: start workspace development tasks through Turbo
- `pnpm dev:main`: start the main frontend app in `apps/web/app/main`
- `pnpm build`: build all apps and packages that define a build task

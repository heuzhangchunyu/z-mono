FROM node:20-alpine AS base

WORKDIR /workspace

RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY apps/server/services/z-meng_backEnd/package.json ./apps/server/services/z-meng_backEnd/package.json

RUN pnpm install --no-frozen-lockfile

FROM deps AS build

COPY apps/server/services/z-meng_backEnd ./apps/server/services/z-meng_backEnd

RUN pnpm --filter z-meng-backend build

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=build /workspace/apps/server/services/z-meng_backEnd/package.json ./package.json
COPY --from=build /workspace/apps/server/services/z-meng_backEnd/dist ./dist
COPY --from=build /workspace/apps/server/services/z-meng_backEnd/config ./config

RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund

ENV NODE_ENV=production
ENV PORT=4101

EXPOSE 4101

CMD ["node", "dist/index.js"]

FROM alpine:3.20

WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && apk --no-cache add nodejs npm \
  && npm install -g pnpm

COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
COPY config ./config
COPY docs ./docs

RUN pnpm install --no-frozen-lockfile
RUN pnpm migrations && pnpm build

ENV NODE_ENV=production
ENV PORT=4102
ENV CORS_ORIGIN=*
ENV SERVICE_NAME=z-mini-drama-backend
ENV SERVICE_VERSION=0.1.0

EXPOSE 4102

CMD ["node", "dist/cmd/server.js"]

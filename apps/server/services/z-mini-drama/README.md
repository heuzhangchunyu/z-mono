# z-mini-drama 后端

`z-mini-drama` 后端服务，使用 `Koa + koa-router + TypeScript` 搭建。

目录结构参考 `examples/exmaple-mini-drama/backend`，保留以下分层思路：

- `src/cmd`：服务启动入口
- `src/internal/api`：接口与中间件
- `src/internal/data`：迁移入口、迁移生成脚本与迁移文件
- `src/internal/service`：业务服务
- `src/internal/model`：领域模型与接口响应类型
- `src/internal/config`：配置读取
- `src/internal/database`：数据库连接
- `config`：配置示例
- `docs/api`：接口文档

## 本地启动

```bash
pnpm dev
```

默认数据库使用 PostgreSQL，可通过环境变量覆盖：

```bash
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=zmini_drama
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

服务启动时会按示例项目的方式执行迁移：

- 源迁移文件放在 `src/internal/data/migrations/*.sql`
- 通过 `-- mig:up/down <version> <name>` 注释声明迁移片段
- 由 `pnpm migrations` 生成 `src/internal/data/migrations/autogen/*.sql`
- 启动时通过 `Migrate(connStr, "autoup")` 自动执行

当前迁移会涉及：

- `schema_migrations`
- `schema_ddls`
- `users`

生成迁移产物：

```bash
pnpm migrations
```

认证相关环境变量：

```bash
AUTH_JWT_SECRET=z-mini-drama-dev-secret
AUTH_TOKEN_EXPIRE_HOURS=12
```

## Docker 启动

```bash
docker compose -f compose.yaml up --build -d
```

停止容器：

```bash
docker compose -f compose.yaml down
```

## Docker 热更新开发模式

开发态 Compose 不会替换生产态配置，使用独立文件：

```bash
docker compose -f compose.dev.yaml up --build
```

特点：

- 挂载本地 `src`、`config`、`docs` 到容器内
- 容器内执行 `pnpm dev`
- 本地修改代码后，`tsx watch` 会在容器内自动重启服务
- 默认映射到宿主机端口 `4103`，避免和生产态容器占用同一个端口

停止开发态容器：

```bash
docker compose -f compose.dev.yaml down
```

开发态健康检查地址：

```bash
http://127.0.0.1:4103/api/health
```

说明：

- 如果修改了 `package.json` 里的依赖，建议重新执行 `up --build`
- 生产态 `compose.yaml` 保持不变，继续用于构建运行 `dist` 产物
- 开发态会同时拉起 PostgreSQL，宿主机映射端口为 `5433`

## 当前接口

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/user/current`

开发环境演示账号：

- 用户名：`demo_admin`
- 密码：`demo123456`

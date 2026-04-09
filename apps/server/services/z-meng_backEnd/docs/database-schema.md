# z-meng 数据库表结构

本文档基于当前后端迁移定义整理，反映 `z-meng` 项目当前数据库结构。

当前业务迁移版本：

- `2026040601_users`
- `2026040801_episodes`
- `2026040802_episode_name`
- `2026040803_episode_owner`

## 业务表

### `users`

用途：用户信息表。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | 用户 ID |
| `username` | `VARCHAR(50)` | `NOT NULL` | 用户名 |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | 密码哈希 |
| `display_name` | `VARCHAR(100)` | 可空 | 展示名称 |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'user'` | 角色，当前注释为 `user / admin` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | 是否启用 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |
| `deleted_at` | `TIMESTAMPTZ` | 可空 | 软删除时间 |

索引与约束：

- 主键：`users_pkey (id)`
- 唯一索引：`idx_users_username (username)`
- 普通索引：`idx_users_deleted_at (deleted_at)`

### `episodes`

用途：剧集创作表。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `script_id` | `BIGSERIAL` | 主键 | 剧本 ID |
| `script_content` | `TEXT` | `NOT NULL` | 剧本内容 |
| `style` | `VARCHAR(20)` | `NOT NULL` | 创作风格，注释为 `动漫 / 真人` |
| `aspect_ratio` | `VARCHAR(10)` | `NOT NULL` | 画面比例，注释为 `16:9 / 9:16 / 1:1` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |
| `deleted_at` | `TIMESTAMPTZ` | 可空 | 软删除时间 |
| `episode_name` | `VARCHAR(120)` | `NOT NULL` | 剧集名 |
| `user_id` | `BIGINT` | 可空 | 所属用户 ID |

索引与约束：

- 主键：`episodes_pkey (script_id)`
- 普通索引：`idx_episodes_deleted_at (deleted_at)`
- 普通索引：`idx_episodes_style (style)`
- 普通索引：`idx_episodes_user_id (user_id)`
- 外键：`fk_episodes_user_id (user_id) REFERENCES users(id)`

表关系：

- `episodes.user_id -> users.id`，表示一个剧集可归属于一个用户
- 归属用户名来自 `users.username`，查询 `episodes` 时如需展示用户名，需要通过 `user_id` 关联 `users` 表获取

## 迁移元数据表

以下两张表不是业务表，而是当前项目迁移系统自维护的元数据表。

### `schema_ddls`

用途：保存各版本迁移 SQL 内容。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `version` | `BIGINT` | 主键 | 迁移版本号 |
| `up` | `TEXT` | `NOT NULL DEFAULT ''` | 升级 SQL |
| `down` | `TEXT` | `NOT NULL DEFAULT ''` | 回滚 SQL |
| `prev_version` | `BIGINT` | `NOT NULL DEFAULT 0` | 上一个迁移版本 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 记录创建时间 |

### `schema_migrations`

用途：保存当前数据库迁移状态。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `SMALLINT` | 主键，默认 `1`，且限制只能为 `1` | 单行状态记录 |
| `version` | `BIGINT` | `NOT NULL DEFAULT 0` | 当前数据库迁移版本 |
| `dirty` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | 是否存在失败后未清理的脏状态 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 最近更新时间 |

## 来源文件

- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/users.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episodes.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_name.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_owner.sql`
- `apps/server/services/z-meng_backEnd/src/pkg/migrate/migrate.ts`

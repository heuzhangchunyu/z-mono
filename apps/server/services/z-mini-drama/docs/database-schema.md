# z-mini-drama 数据库表结构说明

本文档记录 `apps/server/services/z-mini-drama` 当前后端服务实际使用的数据库表结构，以及表之间的约束关系。

当前表来源：
- 业务表：`src/internal/data/migrations/users.sql`
- 业务表：`src/internal/data/migrations/projects.sql`
- 迁移系统表：`src/internal/data/migrate.ts`

## 表关系总览

```text
users
  └─< user_projects >─┘
           │
           └── projects

schema_migrations
schema_ddls
```

说明：
- `users` 和 `projects` 是业务主表。
- `user_projects` 是用户与项目的关联表，用于控制“哪个用户可以访问哪个项目”。
- `schema_migrations` 和 `schema_ddls` 是迁移系统内部使用的表，不参与业务查询。

## 1. users

用途：
- 存储登录用户、注册用户及认证相关字段。

字段：

| 字段名 | 类型 | 为空 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 否 | 自增 | 用户主键 |
| `username` | `VARCHAR(50)` | 否 | - | 用户名 |
| `password_hash` | `TEXT` | 否 | - | 密码哈希 |
| `nickname` | `VARCHAR(100)` | 否 | `''` | 昵称 |
| `role` | `VARCHAR(20)` | 否 | `'user'` | 用户角色 |
| `is_active` | `BOOLEAN` | 否 | `TRUE` | 是否启用 |
| `created_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 更新时间 |

约束与索引：
- 主键：`PRIMARY KEY (id)`
- 唯一索引：`users_username_unique_idx`  
  基于 `BTRIM(username)`，保证去掉首尾空格后的用户名唯一
- 检查约束：`users_role_check`
  - 仅允许：`user`
  - 仅允许：`admin`

备注：
- 迁移会自动插入一个演示账号：`demo_admin`

## 2. projects

用途：
- 存储创作项目本身的信息，是“项目列表”和“创建项目”功能的核心主表。

字段：

| 字段名 | 类型 | 为空 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 否 | 自增 | 项目主键 |
| `name` | `VARCHAR(255)` | 否 | - | 项目名称 |
| `description` | `TEXT` | 否 | `''` | 项目描述 |
| `status` | `VARCHAR(50)` | 否 | `'draft'` | 项目状态 |
| `aspect_ratio` | `VARCHAR(20)` | 是 | `NULL` | 画幅比例，如 `16:9` / `9:16` |
| `global_art_style` | `TEXT` | 是 | `NULL` | 全局画风设定 |
| `visual_asset_description` | `JSONB` | 否 | `'[]'::jsonb` | 视觉资产描述数组 |
| `created_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 更新时间 |
| `deleted_at` | `TIMESTAMPTZ` | 是 | `NULL` | 软删除时间 |

约束与索引：
- 主键：`PRIMARY KEY (id)`
- 检查约束：`projects_status_check`
  - 仅允许：`draft`
  - 仅允许：`in_progress`
  - 仅允许：`completed`
- 索引：`projects_status_idx`
- 索引：`projects_deleted_at_idx`

备注：
- 当前项目列表接口只返回 `deleted_at IS NULL` 的项目。
- `visual_asset_description` 先作为后续角色/场景/道具资产扩展的预留字段。

## 3. user_projects

用途：
- 存储用户与项目的关联关系，表示“某个用户可以访问某个项目”。

字段：

| 字段名 | 类型 | 为空 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 否 | 自增 | 关联主键 |
| `user_id` | `BIGINT` | 否 | - | 关联的用户 ID |
| `project_id` | `BIGINT` | 否 | - | 关联的项目 ID |
| `created_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 更新时间 |

约束与索引：
- 主键：`PRIMARY KEY (id)`
- 唯一约束：`UNIQUE(user_id, project_id)`
  - 保证同一个用户不会重复关联同一个项目
- 外键：`fk_user_projects_user`
  - `user_id -> users(id)`
  - `ON DELETE CASCADE`
- 外键：`fk_user_projects_project`
  - `project_id -> projects(id)`
  - `ON DELETE CASCADE`
- 索引：`user_projects_user_id_idx`
- 索引：`user_projects_project_id_idx`

备注：
- 创建项目时，后端会自动插入一条 `user_projects` 记录，把当前登录用户和新项目关联起来。
- 普通用户的项目列表查询会通过这张表做权限过滤。

## 4. schema_migrations

用途：
- 迁移系统内部表，用于记录当前数据库迁移到哪个版本，以及是否处于脏状态。

字段：

| 字段名 | 类型 | 为空 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `version` | `BIGINT` | 否 | - | 当前迁移版本 |
| `dirty` | `BOOLEAN` | 否 | `FALSE` | 当前版本是否处于脏状态 |

约束：
- 主键：`PRIMARY KEY (version)`

备注：
- 这是迁移器运行时的状态表，不是业务表。

## 5. schema_ddls

用途：
- 迁移系统内部表，用于保存每个迁移版本对应的 `up/down SQL`。

字段：

| 字段名 | 类型 | 为空 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `version` | `BIGINT` | 否 | - | 迁移版本 |
| `up` | `TEXT` | 否 | `''` | 升级 SQL |
| `down` | `TEXT` | 否 | `''` | 回滚 SQL |
| `prev_version` | `BIGINT` | 否 | `0` | 前一个迁移版本 |
| `created_at` | `TIMESTAMPTZ` | 否 | `NOW()` | 写入时间 |

约束：
- 主键：`PRIMARY KEY (version)`

备注：
- 这是迁移器内部表，不是业务表。

## 当前业务约束总结

1. 用户名唯一
   - 由 `users_username_unique_idx` 保证。

2. 用户角色受限
   - `users.role` 只能是 `user` 或 `admin`。

3. 项目状态受限
   - `projects.status` 只能是 `draft`、`in_progress`、`completed`。

4. 用户与项目是多对多关系
   - 通过 `user_projects` 实现。

5. 删除用户或项目时会自动清理关联关系
   - 由 `user_projects` 的两个外键 `ON DELETE CASCADE` 保证。

## 后续扩展建议

如果后面继续对齐 `example-mini-drama` 的完整工作流，建议继续在此基础上补：
- `scripts`
- `episodes`
- 角色、场景、分镜等资产表

推荐继续保持分层：
- 主体业务实体表
- 用户与资源的关联表
- 迁移系统内部表

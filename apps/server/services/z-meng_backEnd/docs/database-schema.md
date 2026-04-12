# z-meng 数据库表结构

本文档基于当前后端迁移定义整理，反映 `z-meng` 项目当前数据库结构。

当前业务迁移版本：

- `2026040601_users`
- `2026040801_episodes`
- `2026040802_episode_name`
- `2026040803_episode_owner`
- `2026040901_episode_remove_script_content`
- `2026040902_episode_restore_script_content`
- `2026040903_episode_current_stage`
- `2026040904_ai_prompt_templates_and_llm_call_logs`
- `2026041101_extract_subjects_prompt_template`
- `2026041102_episode_subjects`
- `2026041103_prompt_templates_use_qwen36plus`
- `2026041201_episode_subject_items`
- `2026041202_episode_subject_images`

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
| `script_content` | `TEXT` | `NOT NULL DEFAULT ''` | 剧本内容 |
| `style` | `VARCHAR(20)` | `NOT NULL` | 创作风格，注释为 `动漫 / 真人` |
| `aspect_ratio` | `VARCHAR(10)` | `NOT NULL` | 画面比例，注释为 `16:9 / 9:16 / 1:1` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |
| `deleted_at` | `TIMESTAMPTZ` | 可空 | 软删除时间 |
| `episode_name` | `VARCHAR(120)` | `NOT NULL` | 剧集名 |
| `user_id` | `BIGINT` | 可空 | 所属用户 ID |
| `current_stage` | `VARCHAR(32)` | `NOT NULL DEFAULT 'script'` | 当前剧集阶段，取值为 `script / subject / keyframes / video-production` |

索引与约束：

- 主键：`episodes_pkey (script_id)`
- 普通索引：`idx_episodes_deleted_at (deleted_at)`
- 普通索引：`idx_episodes_style (style)`
- 普通索引：`idx_episodes_user_id (user_id)`
- 外键：`fk_episodes_user_id (user_id) REFERENCES users(id)`

表关系：

- `episodes.user_id -> users.id`，表示一个剧集可归属于一个用户
- 归属用户名来自 `users.username`，查询 `episodes` 时如需展示用户名，需要通过 `user_id` 关联 `users` 表获取

### `prompt_templates`

用途：AI 提示词模板表。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | 模板 ID |
| `type` | `VARCHAR(64)` | `NOT NULL` | 模板类型，例如 `script_generation` |
| `description` | `TEXT` | `NOT NULL DEFAULT ''` | 模板说明 |
| `template` | `TEXT` | `NOT NULL` | 提示词模板，支持 `{key}` / `{{key}}` 占位符 |
| `system_prompt` | `TEXT` | 可空 | 系统提示词 |
| `model` | `VARCHAR(100)` | 可空 | 模板默认模型 |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | 是否启用 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |
| `deleted_at` | `TIMESTAMPTZ` | 可空 | 软删除时间 |

索引与约束：

- 主键：`prompt_templates_pkey (id)`
- 普通索引：`idx_prompt_templates_type (type)`
- 普通索引：`idx_prompt_templates_active_type (type, is_active)`
- 普通索引：`idx_prompt_templates_deleted_at (deleted_at)`

### `llm_call_logs`

用途：记录大模型调用日志。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | 日志 ID |
| `user_id` | `BIGINT` | 可空 | 发起调用的用户 ID |
| `prompt_template_id` | `BIGINT` | 可空 | 命中的提示词模板 ID |
| `provider` | `VARCHAR(50)` | `NOT NULL` | 模型提供商 |
| `model` | `VARCHAR(100)` | `NOT NULL` | 实际调用模型名 |
| `source` | `VARCHAR(100)` | `NOT NULL DEFAULT 'ai_chat'` | 调用来源 |
| `input` | `TEXT` | `NOT NULL` | 实际输入提示词 |
| `output` | `TEXT` | `NOT NULL` | 模型输出 |
| `finish_reason` | `VARCHAR(50)` | 可空 | 结束原因 |
| `input_tokens` | `INTEGER` | `NOT NULL DEFAULT 0` | 输入 token 数 |
| `output_tokens` | `INTEGER` | `NOT NULL DEFAULT 0` | 输出 token 数 |
| `total_tokens` | `INTEGER` | `NOT NULL DEFAULT 0` | 总 token 数 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |

索引与约束：

- 主键：`llm_call_logs_pkey (id)`
- 普通索引：`idx_llm_call_logs_user_id (user_id)`
- 普通索引：`idx_llm_call_logs_prompt_template_id (prompt_template_id)`
- 普通索引：`idx_llm_call_logs_source (source)`
- 普通索引：`idx_llm_call_logs_created_at (created_at)`
- 外键：`fk_llm_call_logs_user (user_id) REFERENCES users(id)`
- 外键：`fk_llm_call_logs_prompt_template (prompt_template_id) REFERENCES prompt_templates(id)`

### `episode_subjects`

用途：记录每个剧集的主体提取状态以及角色 / 场景 / 道具名称列表。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | 记录 ID |
| `script_id` | `BIGINT` | `NOT NULL UNIQUE` | 所属剧集 ID |
| `status` | `VARCHAR(32)` | `NOT NULL DEFAULT 'waiting'` | 提取状态，取值为 `waiting / processing / success / failed` |
| `characters_json` | `JSONB` | `NOT NULL DEFAULT '[]'::jsonb` | 角色名称列表 |
| `scenes_json` | `JSONB` | `NOT NULL DEFAULT '[]'::jsonb` | 场景名称列表 |
| `props_json` | `JSONB` | `NOT NULL DEFAULT '[]'::jsonb` | 道具名称列表 |
| `error_message` | `TEXT` | 可空 | 提取失败原因 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |

索引与约束：

- 主键：`episode_subjects_pkey (id)`
- 唯一约束：`script_id`
- 普通索引：`idx_episode_subjects_status (status)`
- 普通索引：`idx_episode_subjects_updated_at (updated_at)`
- 外键：`fk_episode_subjects_script_id (script_id) REFERENCES episodes(script_id)`

表关系：

- `episode_subjects.script_id -> episodes.script_id`
- 一部剧集对应一条主体提取记录，状态和角色 / 场景 / 道具名称都存放在这条记录里

### `episode_subject_items`

用途：剧集主体明细表，每个主体一条记录。这里的 `script_id` 也就是当前项目里的剧集 ID / 剧本 ID。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | 主体 ID |
| `script_id` | `BIGINT` | `NOT NULL` | 所属剧集 ID，等同于当前项目里的剧本 ID |
| `subject_type` | `VARCHAR(20)` | `NOT NULL` | 主体类型：`character / scene / prop` |
| `subject_name` | `VARCHAR(255)` | `NOT NULL` | 主体名称 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |

索引与约束：

- 主键：`episode_subject_items_pkey (id)`
- 普通索引：`idx_episode_subject_items_script_id (script_id)`
- 普通索引：`idx_episode_subject_items_type (subject_type)`
- 唯一索引：`idx_episode_subject_items_unique_name (script_id, subject_type, subject_name)`
- 外键：`fk_episode_subject_items_script_id (script_id) REFERENCES episodes(script_id)`

表关系：

- `episode_subject_items.script_id -> episodes.script_id`
- 每个主体现在都有独立的 `id`
- 后续如果要查询某个主体的图片生成历史，应通过 `episode_subject_items.id` 关联对应图片历史表

### `episode_subject_images`

用途：主体图片生成历史表，每次主体生图请求对应一条记录。

| 字段名 | 类型 | 约束/默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | 图片生成记录 ID |
| `subject_item_id` | `BIGINT` | `NOT NULL` | 主体 ID，对应 `episode_subject_items.id` |
| `script_id` | `BIGINT` | `NOT NULL` | 所属剧集 ID，等同于当前项目里的剧本 ID |
| `prompt` | `TEXT` | `NOT NULL DEFAULT ''` | 本次主体生图要求 |
| `image_url` | `TEXT` | 可空 | 生成成功后的图片地址 |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'waiting'` | 生图状态，取值为 `waiting / processing / success / failed` |
| `provider` | `VARCHAR(50)` | `NOT NULL DEFAULT 'dashscope'` | 图片模型提供商 |
| `model` | `VARCHAR(100)` | `NOT NULL DEFAULT ''` | 实际使用的图片模型名 |
| `error_message` | `TEXT` | 可空 | 生成失败原因 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | 更新时间 |

索引与约束：

- 主键：`episode_subject_images_pkey (id)`
- 普通索引：`idx_episode_subject_images_subject_item_id (subject_item_id, created_at DESC)`
- 普通索引：`idx_episode_subject_images_script_id (script_id)`
- 外键：`fk_episode_subject_images_subject_item_id (subject_item_id) REFERENCES episode_subject_items(id)`
- 外键：`fk_episode_subject_images_script_id (script_id) REFERENCES episodes(script_id)`

表关系：

- `episode_subject_images.subject_item_id -> episode_subject_items.id`
- `episode_subject_images.script_id -> episodes.script_id`
- 同一个主体可以有多条图片生成历史记录，前端轮询和历史图片列表都从这张表读取

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
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_remove_script_content.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_restore_script_content.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_current_stage.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/ai_prompt_templates_and_llm_call_logs.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/extract_subjects_prompt_template.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_subjects.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_subject_items.sql`
- `apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_subject_images.sql`
- `apps/server/services/z-meng_backEnd/src/pkg/migrate/migrate.ts`

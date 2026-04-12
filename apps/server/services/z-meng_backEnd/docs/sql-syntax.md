# z-meng 数据库语法说明

这份文档用来解释 `z-meng` 项目里迁移 SQL 的常见写法，尤其是初始化提示词模板时出现的语法。

本文重点结合这段真实代码说明：

```sql
INSERT INTO prompt_templates (
    type,
    description,
    template,
    system_prompt,
    model,
    is_active,
    created_at,
    updated_at
)
SELECT
    'extract_subjects' AS type,
    '从剧本内容中提取角色、场景、道具的提示词模板' AS description,
    $$...提示词正文...$$ AS template,
    '你是一名擅长剧本拆解与影视资产规划的中文编剧助理。' AS system_prompt,
    'qwen-plus' AS model,
    TRUE AS is_active,
    NOW() AS created_at,
    NOW() AS updated_at
WHERE NOT EXISTS (
    SELECT 1
    FROM prompt_templates
    WHERE type = 'extract_subjects'
      AND deleted_at IS NULL
);
```

## `INSERT INTO ... SELECT`

含义：
不是用 `VALUES (...)` 手动写一行数据，而是把 `SELECT` 查出来的一行结果插入表里。

基础结构：

```sql
INSERT INTO 表名 (列1, 列2, 列3)
SELECT 值1, 值2, 值3;
```

可以理解成：

1. 指定要插入哪张表、哪些列
2. 用 `SELECT` 生成一行数据
3. 把这行数据插进去

### 为什么这里不用 `VALUES`

因为 `SELECT` 后面可以很自然地继续接条件，例如：

```sql
INSERT INTO users (username, role)
SELECT 'alice', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'alice'
);
```

这表示：
只有当 `alice` 不存在时，才插入这条数据。

## `AS`

含义：
给当前值起一个别名，对应插入列的语义。

示例：

```sql
SELECT
    'extract_subjects' AS type,
    TRUE AS is_active,
    NOW() AS created_at;
```

这里的意思是：

- `'extract_subjects'` 这段字符串，作为 `type`
- `TRUE` 作为 `is_active`
- `NOW()` 作为 `created_at`

## `$$ ... $$`

含义：
PostgreSQL 的多行字符串写法。

适合放很长的文本，比如：

- 提示词正文
- Markdown
- JSON 模板
- 多行说明文案

示例：

```sql
SELECT
    $$第一行
第二行
第三行$$ AS content;
```

这样写的好处是：

- 不需要把每个单引号都转义
- 可以直接保留多行结构
- 很适合 prompt 模板

在 `z-meng` 里，`template` 字段就是用这种方式写入长提示词的。

## `NOW()`

含义：
取数据库当前时间。

示例：

```sql
SELECT NOW() AS created_at;
```

常用于：

- `created_at`
- `updated_at`

## `TRUE` / `FALSE`

含义：
布尔值。

示例：

```sql
SELECT TRUE AS is_active;
```

在模板表里：

- `TRUE` 表示模板激活
- `FALSE` 表示模板未激活

## `WHERE NOT EXISTS`

含义：
只有当某个查询结果不存在时，才执行当前这次插入。

这是迁移里非常常见的“防重复插入”写法。

示例：

```sql
INSERT INTO prompt_templates (type, description)
SELECT 'extract_subjects', '主体提取模板'
WHERE NOT EXISTS (
    SELECT 1
    FROM prompt_templates
    WHERE type = 'extract_subjects'
      AND deleted_at IS NULL
);
```

可以理解成：

1. 先去 `prompt_templates` 表里查
2. 看有没有一条 `type = 'extract_subjects'` 且没被删除的数据
3. 如果没有，才插入新的模板

### `SELECT 1` 是什么意思

这里的 `1` 不重要，只是表示“我只关心有没有结果，不关心具体字段内容”。

所以：

```sql
SELECT 1 FROM prompt_templates WHERE ...
```

本质上是在问：
“这张表里有没有符合条件的记录？”

## 结合当前文件整句理解

下面这段：

```sql
INSERT INTO prompt_templates (...)
SELECT ...
WHERE NOT EXISTS (
    SELECT 1
    FROM prompt_templates
    WHERE type = 'extract_subjects'
      AND deleted_at IS NULL
);
```

完整含义是：

- 向 `prompt_templates` 表插入一条默认模板
- 这条模板的类型叫 `extract_subjects`
- 模板正文是多行 prompt
- 默认模型是 `qwen-plus`
- 默认激活
- 但只有当库里还没有同类型模板时才插入

也就是说，这是一种“初始化默认数据，但避免重复写入”的迁移写法。

## 对比：`VALUES` 写法

最普通的插入是：

```sql
INSERT INTO prompt_templates (type, description)
VALUES ('extract_subjects', '主体提取模板');
```

这种写法简单，但不适合直接附带“如果不存在才插入”的条件。

所以在迁移里，如果要做“安全初始化”，更常见的是：

```sql
INSERT INTO ... SELECT ...
WHERE NOT EXISTS (...);
```

## 在 `z-meng` 里的典型用途

目前这类语法主要用于：

- 初始化默认提示词模板
- 初始化系统内置数据
- 避免迁移重复执行时插入重复记录

相关文件参考：

- [extract_subjects_prompt_template.sql](/Users/zhangchunyu/Desktop/绘塔/z-mono/apps/server/services/z-meng_backEnd/src/internal/data/migrations/extract_subjects_prompt_template.sql)
- [ai_prompt_templates_and_llm_call_logs.sql](/Users/zhangchunyu/Desktop/绘塔/z-mono/apps/server/services/z-meng_backEnd/src/internal/data/migrations/ai_prompt_templates_and_llm_call_logs.sql)

## `CREATE TABLE IF NOT EXISTS`

含义：
创建一张新表；如果这张表已经存在，就跳过，不报错。

基础结构：

```sql
CREATE TABLE IF NOT EXISTS 表名 (
  字段定义1,
  字段定义2,
  约束定义
);
```

这类语法通常出现在：

- 新增业务表
- 新增中间表
- 新增明细表

在 `z-meng` 里，主体明细表就是一个典型例子：

```sql
CREATE TABLE IF NOT EXISTS episode_subject_items (
    id BIGSERIAL PRIMARY KEY,
    script_id BIGINT NOT NULL,
    subject_type VARCHAR(20) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_episode_subject_items_script_id
      FOREIGN KEY (script_id)
      REFERENCES episodes(script_id)
      ON DELETE CASCADE,
    CONSTRAINT chk_episode_subject_items_type
      CHECK (subject_type IN ('character', 'scene', 'prop'))
);
```

## 字段定义

### `id BIGSERIAL PRIMARY KEY`

含义：

- `id` 是这一行记录的唯一标识
- `BIGSERIAL` 表示数据库自动生成递增大整数
- `PRIMARY KEY` 表示主键，不能重复，也不能为空

在 `episode_subject_items` 里：

- 每个主体都有独立 `id`
- 以后查询某个主体的图片历史，就可以通过这个 `id` 关联

### `script_id BIGINT NOT NULL`

含义：

- `script_id` 是大整数
- `NOT NULL` 表示必填

在你们项目里：

- `script_id` 同时就是“剧集 id / 剧本 id”

也就是说这个字段表示：
这个主体属于哪一个剧集。

### `subject_type VARCHAR(20) NOT NULL`

含义：

- `VARCHAR(20)` 表示最长 20 个字符的字符串
- `NOT NULL` 表示不能为空

这里用来存主体类型，比如：

- `character`
- `scene`
- `prop`

### `subject_name VARCHAR(255) NOT NULL`

含义：

- 主体名称
- 最长 255 个字符
- 不能为空

例如：

- `林夏`
- `天台`
- `录音笔`

### `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

含义：

- `TIMESTAMPTZ` 表示带时区时间
- `NOT NULL` 表示不能为空
- `DEFAULT NOW()` 表示默认取当前时间

这个字段记录：
这条数据是什么时候创建的。

### `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

含义：

- 也是带时区时间
- 默认当前时间

这个字段记录：
这条数据最近一次更新时间。

## `CONSTRAINT`

含义：
给约束起一个明确名字，方便后续排查、维护和阅读。

基础结构：

```sql
CONSTRAINT 约束名 约束内容
```

这样做的好处是：

- 约束名称清晰
- 报错时更容易定位
- 后续如果要删除或修改约束更方便

## `FOREIGN KEY`

示例：

```sql
CONSTRAINT fk_episode_subject_items_script_id
  FOREIGN KEY (script_id)
  REFERENCES episodes(script_id)
  ON DELETE CASCADE
```

含义：

- 当前表的 `script_id`
- 必须引用 `episodes` 表里已经存在的 `script_id`

也就是说：
不能插入一个“没有对应剧集”的主体。

### `ON DELETE CASCADE`

含义：
如果主表里的那条剧集被删除了，当前表里关联的主体记录也自动删除。

这样可以避免出现“孤儿数据”。

## `CHECK`

示例：

```sql
CONSTRAINT chk_episode_subject_items_type
  CHECK (subject_type IN ('character', 'scene', 'prop'))
```

含义：
限制某个字段的取值范围。

这里表示：

- `subject_type` 只能是 `character`
- 或 `scene`
- 或 `prop`

不能写成其他无效值。

这种写法的作用是：

- 保证数据规范
- 避免脏数据
- 让后端和前端都能稳定依赖这个枚举值

## 整段 SQL 的整体含义

上面这段 `CREATE TABLE` SQL 整体可以理解成：

1. 创建一张“主体明细表”
2. 每个主体一条记录
3. 每条记录都有自己的主体 `id`
4. 每个主体都属于某个剧集 `script_id`
5. 每个主体都有类型和名称
6. 类型值被限制在 `character / scene / prop`
7. 剧集被删除时，主体记录自动一起删除

## 在 `z-meng` 里的典型用途

目前这类建表语法主要用于：

- 新增主体明细表
- 为后续“主体图片生成历史”提供稳定的主体 id
- 将原本数组结构的主体信息，升级为真正可关联的实体记录

相关文件参考：

- [episode_subject_items.sql](/Users/zhangchunyu/Desktop/绘塔/z-mono/apps/server/services/z-meng_backEnd/src/internal/data/migrations/episode_subject_items.sql)
- [episodes.sql](/Users/zhangchunyu/Desktop/绘塔/z-mono/apps/server/services/z-meng_backEnd/src/internal/data/migrations/episodes.sql)

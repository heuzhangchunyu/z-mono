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

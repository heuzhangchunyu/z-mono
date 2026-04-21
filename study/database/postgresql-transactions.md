# PostgreSQL 事务用法笔记

本文档用于记录 PostgreSQL 中事务（Transaction）的基本概念、常见语法、典型使用场景，以及在 `z-mini-drama` 项目里的实际应用方式。

## 1. 什么是事务

事务可以理解成“一组必须作为整体执行的数据库操作”。

事务有两个核心目标：
- 要么这一组操作全部成功
- 要么这一组操作全部失败并回滚

它解决的问题是：
- 避免只执行了一半的数据修改
- 保证多步写入之间的一致性

例如：
- 创建项目
- 把项目分配给当前用户

这两步如果拆开执行，就可能出现：
- `projects` 插入成功
- `user_projects` 插入失败

结果数据库里就会出现“项目存在，但没人能访问”的脏数据。

这时就应该使用事务。

## 2. 事务的基本语法

PostgreSQL 最常见的事务语法是：

```sql
BEGIN;

-- 一组 SQL
INSERT INTO projects (name) VALUES ('短剧项目 A');
INSERT INTO user_projects (user_id, project_id) VALUES (1, 10);

COMMIT;
```

如果中间任何一步失败，就应该执行：

```sql
ROLLBACK;
```

三条关键命令分别表示：

- `BEGIN`
  开始一个事务
- `COMMIT`
  提交事务，让前面的修改正式生效
- `ROLLBACK`
  回滚事务，把事务中的修改全部撤销

## 3. 一个最简单的例子

假设银行转账：

1. 用户 A 扣 100 元
2. 用户 B 加 100 元

如果只做了第 1 步，第 2 步失败，就会出现资金不一致。

正确写法应该是：

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

如果任何一步报错：

```sql
ROLLBACK;
```

## 4. 什么时候应该用事务

以下情况通常都应该考虑事务：

- 一次业务动作要写多张表
- 一次业务动作包含多步更新
- 一部分成功、一部分失败会产生脏数据
- 要保证数据状态的一致性

典型例子：

- 创建订单 + 扣库存
- 创建项目 + 建立用户项目关联
- 删除主表数据 + 删除附属关系
- 批量插入多条强关联数据

## 5. 什么时候不一定要用事务

如果只是单条、独立、原子性的写入，很多时候不需要手动包事务。

例如：

```sql
INSERT INTO users (username, password_hash)
VALUES ('tom', 'xxx');
```

单条 `INSERT` 本身就是一个原子操作。  
但如果后面还要继续插别的表，就通常要考虑事务。

## 6. 在 Node.js / pg 里如何使用事务

在 `pg` 驱动里，事务必须绑定在同一个连接上。

错误示意：

```ts
await pool.query('BEGIN');
await pool.query('INSERT ...');
await pool.query('INSERT ...');
await pool.query('COMMIT');
```

这样写不安全，因为 `pool.query(...)` 可能每次拿到的不是同一个连接。

正确方式是：

```ts
const client = await pool.connect();

try {
  await client.query('BEGIN');

  await client.query('INSERT ...');
  await client.query('INSERT ...');

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

这里有三个关键点：

1. 必须先 `pool.connect()`
   因为事务要固定在同一个连接上执行。

2. `try / catch / finally` 是标准写法
   - `try` 里执行事务逻辑
   - `catch` 里回滚
   - `finally` 里释放连接

3. 一定要 `client.release()`
   否则会造成连接泄漏，最后连接池被耗尽。

## 7. z-mini-drama 里的真实例子

当前项目里最典型的事务例子在：

[project.repository.ts](/Users/zhangchunyu/Desktop/绘塔/z-mono/apps/server/services/z-mini-drama/src/internal/repository/project.repository.ts)

核心代码是：

```ts
async createProject(input: CreateProjectInput, userId: number) {
  const client = await this.pool.connect();

  try {
    await client.query('BEGIN');

    const createdProject = await insertProject(client, input);
    await client.query(
      `INSERT INTO user_projects (user_id, project_id)
       VALUES ($1, $2)`,
      [userId, createdProject.id]
    );

    await client.query('COMMIT');
    return createdProject;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

这段代码为什么必须用事务：

- 第一步：往 `projects` 表插入项目
- 第二步：往 `user_projects` 表插入项目归属关系

如果没有事务，可能出现：

- 项目已经创建
- 但关联关系没创建成功

这样用户列表里就看不到自己刚创建的项目，数据状态也不完整。

所以这里必须让两步“要么一起成功，要么一起失败”。

## 8. COMMIT 和 ROLLBACK 的意义

### COMMIT

表示：
- 当前事务中的所有 SQL 都确认生效
- 数据库状态正式更新

### ROLLBACK

表示：
- 当前事务中已经做过的修改全部撤销
- 数据库恢复到事务开始之前的状态

例如：

```ts
await client.query('BEGIN');
await client.query('INSERT INTO projects ...');
await client.query('INSERT INTO user_projects ...'); // 这里失败
await client.query('COMMIT');
```

如果第二条插入失败，那么执行：

```ts
await client.query('ROLLBACK');
```

结果就是第一条插入也会被撤销。

## 9. 为什么事务必须配合 finally

很多人容易只写：

```ts
try {
  ...
} catch (error) {
  ...
}
```

但事务代码里还必须有：

```ts
finally {
  client.release();
}
```

原因是：
- 不管成功还是失败，数据库连接都要归还给连接池
- 否则连接会一直被占用
- 请求一多，服务会卡死

所以数据库事务代码里，`finally` 不是可选项，而是标准必备项。

## 10. 事务常见误区

### 误区 1：单条 SQL 也必须手动 BEGIN

不一定。  
单条 SQL 本身通常已经是原子操作。

### 误区 2：事务里可以随便混用 `pool.query`

不可以。  
事务必须用同一个 `client`。

### 误区 3：失败了只抛错，不回滚

不行。  
如果事务已经开始，失败时必须显式 `ROLLBACK`。

### 误区 4：回滚后不用释放连接

不行。  
无论成功失败都必须 `release()`。

## 11. 推荐写法模板

以后在本项目里，只要出现“多表写入”或“多步一致性更新”，推荐直接套这个模板：

```ts
const client = await pool.connect();

try {
  await client.query('BEGIN');

  // step 1
  // step 2
  // step 3

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 12. 总结

可以把 PostgreSQL 事务简单记成一句话：

一组强关联的数据库操作，必须放进同一个连接、同一个事务里执行，成功就 `COMMIT`，失败就 `ROLLBACK`，最后一定 `release()`。

对于 `z-mini-drama` 当前项目来说，最典型的事务场景就是：

- 创建项目
- 同时建立用户与项目的关联关系

这就是事务最标准、最有价值的使用方式之一。

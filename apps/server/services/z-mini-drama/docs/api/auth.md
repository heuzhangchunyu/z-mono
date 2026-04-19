# auth 接口文档

## 1. 登录

**接口**: `POST /api/auth/login`

**权限**: 公开

**请求体**:

```json
{
  "username": "demo_admin",
  "password": "demo123456"
}
```

**成功响应**:

```json
{
  "token": "jwt-token",
  "token_expire_at": 1770000000,
  "user": {
    "id": 1,
    "username": "demo_admin",
    "nickname": "即梦样式体验账号",
    "role": "admin"
  }
}
```

**失败场景**:

- `400`: 请求体不是合法 JSON，或用户名、密码为空
- `401`: 用户名或密码错误

**说明**:

- 登录方案参考 `example-mini-drama`，使用 `Bearer Token` 鉴权。
- 开发环境迁移会自动写入一个演示账号：
  - 用户名：`demo_admin`
  - 密码：`demo123456`

## 2. 注册

**接口**: `POST /api/auth/register`

**权限**: 公开

**请求体**:

```json
{
  "username": "new_creator",
  "nickname": "新导演",
  "password": "creator123"
}
```

**成功响应**:

```json
{
  "token": "jwt-token",
  "token_expire_at": 1770000000,
  "user": {
    "id": 2,
    "username": "new_creator",
    "nickname": "新导演",
    "role": "user"
  }
}
```

**失败场景**:

- `400`: 用户名、昵称或密码不符合校验规则
- `409`: 用户名已存在

**说明**:

- 注册成功后会直接签发 token，前端可直接进入工作台。

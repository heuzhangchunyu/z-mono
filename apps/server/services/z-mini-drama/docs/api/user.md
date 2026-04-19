# user 接口文档

## 1. 获取当前登录用户

**接口**: `GET /api/user/current`

**权限**: 需要登录

**请求头**:

```text
Authorization: Bearer <token>
```

**成功响应**:

```json
{
  "id": 1,
  "username": "demo_admin",
  "nickname": "即梦样式体验账号",
  "role": "admin",
  "created_at": "2026-04-19T00:00:00.000Z"
}
```

**失败场景**:

- `401`: 未提供认证信息、认证信息无效或已过期
- `404`: token 对应的用户不存在

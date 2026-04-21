# projects 接口文档

## 1. 创建项目

**接口**: `POST /api/projects`

**权限**: 已登录

**请求头**:

```text
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "古风短剧企划",
  "description": "用于测试短剧项目创建与列表展示",
  "aspect_ratio": "9:16",
  "global_art_style": "国风、电影感、偏克制"
}
```

**成功响应**:

```json
{
  "message": "项目创建成功",
  "data": {
    "id": 1,
    "name": "古风短剧企划",
    "description": "用于测试短剧项目创建与列表展示",
    "status": "draft",
    "aspect_ratio": "9:16",
    "global_art_style": "国风、电影感、偏克制",
    "visual_asset_description": [],
    "created_at": "2026-04-20T09:00:00.000Z",
    "updated_at": "2026-04-20T09:00:00.000Z"
  }
}
```

**失败场景**:

- `400`: 项目名称为空、项目名称过长、描述过长、画幅非法
- `401`: 未登录或 token 无效

**说明**:

- 创建项目时会自动把当前登录用户写入 `user_projects`，用于后续项目列表和权限过滤。

## 2. 获取项目列表

**接口**: `GET /api/projects`

**权限**: 已登录

**请求头**:

```text
Authorization: Bearer <token>
```

**查询参数**:

- `page`: 页码，默认 `1`
- `page_size`: 每页条数，默认 `20`，最大 `100`
- `name`: 按项目名模糊搜索，可选

**示例**:

```text
GET /api/projects?page=1&page_size=20&name=短剧
```

**成功响应**:

```json
{
  "data": [
    {
      "id": 1,
      "name": "古风短剧企划",
      "description": "用于测试短剧项目创建与列表展示",
      "status": "draft",
      "aspect_ratio": "9:16",
      "global_art_style": "国风、电影感、偏克制",
      "visual_asset_description": [],
      "created_at": "2026-04-20T09:00:00.000Z",
      "updated_at": "2026-04-20T09:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

**失败场景**:

- `401`: 未登录或 token 无效

**说明**:

- 普通用户只返回自己在 `user_projects` 中关联的项目。
- 管理员角色会返回全部项目。

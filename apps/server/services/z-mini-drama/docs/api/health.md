# 健康检查接口

## 基本信息

- 接口路径：`/api/health`
- 请求方法：`GET`
- 接口说明：返回当前服务基础状态，便于前端或运维做可用性检查。

## 请求参数

无

## 响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "serviceName": "z-mini-drama-backend",
    "status": "ok",
    "version": "0.1.0",
    "timestamp": "2026-04-19T12:00:00.000Z"
  }
}
```

## 响应字段

- `code`：业务状态码，成功时为 `0`
- `message`：响应消息
- `data.serviceName`：服务名称
- `data.status`：服务状态
- `data.version`：服务版本
- `data.timestamp`：服务端生成时间

## 失败场景

- 服务异常时返回 `500`
- 未匹配接口时返回 `404`

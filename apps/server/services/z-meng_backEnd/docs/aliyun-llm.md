# 阿里云大模型接入

当前项目参考 `mini-drama` 的接入思路，把阿里云百炼封装成了统一的文本生成 provider，并补了提示词模板表与调用日志表。

## 当前能力

- 统一 provider 接口：`src/internal/ai/provider.ts`
- DashScope 实现：`src/internal/ai/dashscope.ts`
- provider 工厂：`src/internal/ai/factory.ts`
- 提示词模板：`prompt_templates`
- 调用日志：`llm_call_logs`
- 对外接口：`POST /ai/chat`
- 已内置模板：`extract_subjects`，用于从剧本内容中提取角色、场景、道具

## 环境变量

不要把真实密钥写进仓库，统一走环境变量：

```bash
export DASHSCOPE_API_KEY="你的阿里云百炼 API Key"
export DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export DASHSCOPE_MODEL="qwen3.6-plus"
```

## 接口示例

需要先登录，并带上当前项目的 `user_id` cookie。

### 直接传 prompt

```bash
curl -X POST http://127.0.0.1:4101/ai/chat \
  -H 'Content-Type: application/json' \
  -H 'Cookie: user_id=1' \
  -d '{
    "prompt": "请生成一个科幻短剧第一集梗概",
    "systemPrompt": "你是一名擅长短剧创作的编剧助手。",
    "model": "qwen3.6-plus",
    "source": "script_generation"
  }'
```

### 按模板调用

```bash
curl -X POST http://127.0.0.1:4101/ai/chat \
  -H 'Content-Type: application/json' \
  -H 'Cookie: user_id=1' \
  -d '{
    "templateType": "script_generation",
    "templateVariables": {
      "episode_name": "机械猫",
      "theme": "赛博悬疑"
    },
    "source": "script_generation"
  }'
```

### 使用主体提取模板

```bash
curl -X POST http://127.0.0.1:4101/ai/chat \
  -H 'Content-Type: application/json' \
  -H 'Cookie: user_id=1' \
  -d '{
    "templateType": "extract_subjects",
    "templateVariables": {
      "content": "【天台夜】林夏握着录音笔逼问陈默，脚边的手机突然亮起。"
    },
    "source": "subject_extraction"
  }'
```

## 返回结构

```json
{
  "message": "AI completion generated successfully.",
  "data": {
    "text": "模型返回的文本内容",
    "model": "qwen3.6-plus",
    "finishReason": "stop",
    "usage": {
      "inputTokens": 123,
      "outputTokens": 456,
      "totalTokens": 579
    },
    "promptTemplateId": 1,
    "templateType": "script_generation"
  }
}
```

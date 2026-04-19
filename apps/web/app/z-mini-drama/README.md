# z-mini-drama 前端

基于 `React + Vite + TypeScript + antd + less + axios` 的前端脚手架，目录结构参考 `examples/example-minidrama-frontend/apps/mini-drama`。

## 目录结构

```text
src/
  api/
  components/
  hooks/
  lib/
  pages/
  services/
  styles/
  types/
```

## 本地启动

```bash
pnpm install
pnpm dev
```

## 环境变量

- `VITE_API_BASE_URL`: axios 默认请求前缀
- `VITE_PROXY_TARGET`: Vite 开发代理目标地址

## 当前登录链路

- 登录页视觉参考即梦首页的明亮渐变与玻璃卡片气质
- `POST /api/auth/login` 获取 Bearer Token
- `POST /api/auth/register` 注册并自动登录
- `GET /api/user/current` 校验当前登录态
- 默认演示账号：`demo_admin / demo123456`

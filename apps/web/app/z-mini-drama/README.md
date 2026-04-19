# z-mini-drama 前端

基于 `React + Vite + TypeScript + antd + less + axios` 的前端脚手架，目录结构参考 `examples/example-minidrama-frontend/apps/mini-drama`。

## 目录结构

```text
src/
  api/
  components/
  hooks/
  pages/
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

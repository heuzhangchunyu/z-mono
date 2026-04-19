# API 目录说明

- `setup.ts`：统一 axios 实例配置
- `interceptors/`：统一拦截器与错误转换
- `modules/`：按业务域拆分接口调用

新增接口时，请按业务域在 `modules/` 下新增文件或方法，并补齐请求参数类型、响应类型和对应接口文档。

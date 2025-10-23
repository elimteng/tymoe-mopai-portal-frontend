# Portal Admin Frontend (React + TypeScript + Vite)

最小骨架：路由、布局、页面占位、日志与服务占位、环境文件、ESLint/Prettier。

## 开发
```bash
pnpm i # 或 npm i / yarn
pnpm dev
```

## 构建
```bash
pnpm build
pnpm preview
```

## 目录结构
```
src/
  layouts/
  pages/
  router/
  services/
  styles/
  utils/
```

## 环境文件
- 使用根目录 `env.develop`、`env.production`（遵循 AI_RULES.md）
- 对前端暴露的变量请使用 `VITE_` 前缀

# ProtoLive

纯 **HTML + CSS + JavaScript** 的 live demo 原型设计工具。

架构上明确区分：

- **引擎** `src/engine/` — 原 gd5 迷你实 DOM 框架（`Component` / `ComponentRender` / `D` / `Log`）
- **产品** `src/product/` — 用引擎实现的原型编辑器

## 目录

```
docs/            产品与引擎说明
src/engine/      引擎
src/product/     产品（组件 + 样式 + 启动）
skills/blocks/   产品积木
skills/engine/   引擎使用约定
test/            测试
index.html       页面槽 + 挂载产品
```

## 快速开始

```bash
python3 -m http.server 8080
# http://localhost:8080

node test/run.mjs
```

## License

MIT

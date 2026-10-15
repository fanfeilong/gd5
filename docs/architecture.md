# Architecture

ProtoLive 是一个**零构建、纯 JS + CSS + HTML** 的 live demo 原型设计工具。

## 目录

```
docs/          文档
src/
  css/         设计令牌与应用样式
  js/          编辑器逻辑（ES modules）
skills/
  blocks/      可复用原型积木（JSON）
test/          无框架单元测试
index.html     应用入口
```

## 运行时数据流

```
skills/blocks ──► skills.js ──► palette
                      │
                      ▼
用户操作 ──► store.js (doc + selection + history)
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       canvas     inspector     preview/export
```

- `store.js`：文档状态、选中项、撤销/重做
- `canvas.js`：画布渲染、拖拽放置、节点移动
- `inspector.js`：属性编辑
- `export.js`：序列化为可独立打开的 HTML
- `preview.js`：用 `srcdoc` 做即时预览

## 设计约束

1. **无打包器、无框架依赖** — 浏览器原生 ES modules
2. **积木与编辑器解耦** — UI 原语在 `skills/`，逻辑在 `src/`
3. **导出即 demo** — 导出文件不依赖 ProtoLive 运行时

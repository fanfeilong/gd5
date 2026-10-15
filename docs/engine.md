# Engine

迷你实模式 HTML 组件引擎（原 gd5 框架，ES module 化）。

## 入口

```js
import {
  Component,
  ComponentRender,
  D,
  Element,
  Log,
  LogEnv,
} from '../src/engine/index.js';
```

## 生命周期

```
navigate(name)
  → componentDidMount(params)
  → render()
  → componentDidAttachEvents()
  → display:block

goBack()
  → componentDidUnMount()
  → display:none
  → 显示上一页（非 modal 时）
```

## 页面槽

`index.html` 里为每个组件准备同名 `id` 节点。`ComponentRender.init` 的 `id` 必须与之对应。

## 与产品的边界

| 属于引擎 | 属于产品 |
|----------|----------|
| 导航栈、挂载时序 | 编辑器业务、积木、导出 HTML |
| `D` / `Element` API | 具体面板布局与样式 |
| `Log` | 原型文档模型 (store) |

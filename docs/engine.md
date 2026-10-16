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

## 刷新（Mount 之后）

进页后改数据不要再 `navigate` 整页重挂，用：

```js
this.setData({ title: '新标题' });     // 合并 state.data 并 refresh()
this.refresh();                        // 仅再跑 render / 子类覆盖逻辑
this.navigator.refresh();              // 刷新当前页
this.navigator.refresh('preview');     // 刷新指定已挂载页
```

约定：

- `AttachEvents` **只在首次 mount** 调用
- 因此 `render()` 在 refresh 路径上应「有壳则只绑 `state.data` → `state.ref`」，避免 `D.clear` 拆掉已绑事件的节点
- 若必须整页重建 DOM，请 `override refresh()` 并自行处理事件

## D / Element（实 DOM DSL）

产品层应优先用 `D` 拼视图，而不是 `createElement` / `innerHTML`。

### 降噪写法（推荐）

```js
import { bind } from '../src/engine/index.js';

const { div, header, h1, button, map, get } = bind();

div({ className: 'app', id: 'appRoot' },
  header({ className: 'toolbar' },
    h1({ className: 'toolbar__title', text: 'ProtoLive' }),
    ...map(
      actions,
      (a, _i, key) => button({ key, className: 'btn', text: a.label }),
      (a) => a.id,
    ),
  ),
);

const [ref, root] = get();
```

| 能力 | 用法 |
|------|------|
| 尾参 children | `d.div(props, child1, child2)`（仍兼容 `.childList`） |
| `bind()` / `D.tags()` | 解构短名 + `h(tag, props, ...kids)` |
| `map(list, render, keyOf)` | 列表自动带 `key` |

### 属性

| 字段 | 作用 |
|------|------|
| `className` | 真实 CSS（可多个） |
| `id` | DOM id + `ref.id` |
| `key` | 逻辑索引 → `ref.key`（列表优先交给 `map`） |
| `dataset` / `style` / `attrs` | 数据属性、样式、setAttribute |
| `text` | innerText |

## 页面槽

`index.html` 里为每个组件准备同名 `id` 节点。`ComponentRender.init` 的 `id` 必须与之对应。

## 与产品的边界

| 属于引擎 | 属于产品 |
|----------|----------|
| 导航栈、挂载时序 | 编辑器业务、积木、导出 HTML |
| `D` / `Element` API | 具体面板布局与样式 |
| `Log` | 原型文档模型 (store) |

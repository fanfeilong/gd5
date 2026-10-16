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
  bind,
} from '../src/engine/index.js';
```

## 生命周期

页面与页内子组件**共用** `mount` / `unmount`：

```
ComponentRender.navigate / child.mount(host)
  → componentDidMount(params)
  → render()
  → componentDidAttachEvents()

goBack / child.unmount()
  → componentDidUnMount()   // 只做业务清理
  → 引擎卸 on() 监听、清宿主、重置 ref
```

宿主可用 `display: contents`，让子组件根节点直接参与父级布局。

## 写组件时怎么少踩坑

| 易错点 | 引擎做法 |
|--------|----------|
| 手写 `D.clear` → `bind` → `get` → `append` | `paint(build)` / `ensureShell(probe, build)` |
| refresh 拆掉壳 → AttachEvents 失效 | `ensureShell`：壳只建一次 |
| `getElementById` 与 `host()` 两套 | 页面也走 `mount`，统一 `this.host()` |
| 忘了 `removeEventListener` | `on` / `onId`，unmount 自动卸 |
| 每个组件手写 `state = { data, ref }` | 基类已提供 |
| DidUnMount 里再清 DOM | 不必；引擎 teardown 统一清 |
| 样式堆在全局 `app.css` | 旁挂 `FooComponent.css` + `static styles` |

## 样式与组件同目录

```js
export class ToolbarComponent extends Component {
  static styles = new URL('./ToolbarComponent.css', import.meta.url);
  // …
}
```

- `mount` 前会 `adoptStylesFor(this.constructor)`，相同 URL / 文本只注入一次
- 也可手写：`Component.adoptStyles(urlOrCssText)` / `adoptStylesFor(Ctor)`
- **全局**：`css/tokens.css`（变量）+ `css/base.css`（reset、页槽、`.btn` / `.field`）
- **组件私有**：旁挂 `components/FooComponent.css`，不要再写进大一锅 `app.css`
- unmount **不**移除样式（多实例 / 再挂载共享）

### 推荐骨架

```js
export class Panel extends Component {
  componentDidAttachEvents() {
    this.onId('btnSave', 'click', () => this.save());
    this.on(window, 'keydown', (e) => { /* … */ });
  }

  render() {
    this.ensureShell(
      (ids) => ids.panel,
      ({ div, button }) => {
        div(
          { className: 'panel', id: 'panel' },
          button({ id: 'btnSave', type: 'button', text: '保存' })
        );
      }
    );
    // refresh 路径：只绑 data → ids()
    const { title } = this.ids();
    if (title) title.textContent = this.state.data.title;
  }
}
```

## 刷新（Mount 之后）

```js
this.setData({ title: '新标题' });     // 合并 state.data 并 refresh()
this.refresh();                        // 仅再跑 render / 子类覆盖
this.navigator.refresh();              // 刷新当前页
this.navigator.refresh('preview');     // 刷新指定已挂载页
```

- `AttachEvents` **只在首次 mount**
- 壳用 `ensureShell`；动态区可局部 `D.clear` 再画（如 Inspector body）

## API 速查

| 方法 | 作用 |
|------|------|
| `mount(host, params)` | 挂载（页面 / 子组件） |
| `unmount()` | 卸载 + 自动清理 |
| `host()` / `isMounted()` | 宿主与状态 |
| `ids()` / `keys()` | `state.ref.id` / `key` |
| `paint(build)` | 整棵重建 |
| `ensureShell(probe, build)` | 壳只建一次 |
| `on(target, type, fn)` / `onId(id, type, fn)` | 事件（自动清理） |
| `static styles` / `adoptStyles` | 旁挂 CSS，mount 注入 |
| `setData` / `refresh` | 挂载后更新 |

## D / Element（实 DOM DSL）

```js
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

在 Component 里优先用 `ensureShell` / `paint`，一般不必自己 `get` + `append`。

| 字段 | 作用 |
|------|------|
| `className` | 真实 CSS（可多个） |
| `id` | DOM id + `ref.id` |
| `key` | 逻辑索引 → `ref.key` |
| `dataset` / `style` / `attrs` | 数据属性、样式、setAttribute |
| `text` | innerText |

## 页面槽

`index.html` 里为每个组件准备同名 `id` 节点。`ComponentRender.init` 的 `id` 必须与之对应。

## 与产品的边界

| 属于引擎 | 属于产品 |
|----------|----------|
| 导航栈、挂载时序、paint/on | 编辑器业务、积木、导出 HTML |
| `D` / `Element` API | 具体面板布局与样式 |
| `Log` | 原型文档模型 (store) |

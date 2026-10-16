# gd5 Engine

A minimal **real-DOM** component runtime for the browser — no virtual DOM, no bundler, no framework lock-in. Ship native ES modules; consumers import and write.

`src/product/` (ProtoLive) is **only a reference app** built on the engine. Treat it as documentation by example, not the primary deliverable.

[中文说明](#中文)

---

## Design goals

| Goal | Approach |
|------|----------|
| Small surface | `Component`, `ComponentRender`, `D` / `bind`, `Log`, style adoption |
| Real DOM | Mutate elements directly; skip VDOM diff overhead |
| Zero build | `import` from `src/engine/index.js` over HTTP |
| One lifecycle | Pages and nested UI both use `mount` / `unmount` |
| Hard to misuse | `ensureShell`, declarative `onClick`, co-located CSS, auto listener cleanup |

Inspired by the original gd5 mini framework; this tree is the ES-module evolution.

---

## Install / consume

There is **no package build step** and no required `dist/`. Use it like a module-native library (closer to “script tag + API” than to a React toolchain):

```html
<script type="module">
  import {
    Component,
    ComponentRender,
    bind,
    LogEnv,
  } from './src/engine/index.js';

  // your app…
</script>
```

Serve over HTTP (ES modules need a server):

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Optional later: publish an IIFE/UMD bundle for a global `gd5` if you want a single classic `<script src>` — not required for normal use.

---

## Quick start (engine author / consumer)

### 1. Page slots in HTML

```html
<div id="home"></div>
<div id="settings" style="display:none"></div>

<script type="module" src="./app.js"></script>
```

### 2. Define a component

```js
import { Component } from './src/engine/index.js';

export class HomePage extends Component {
  static styles = new URL('./HomePage.css', import.meta.url);

  async componentDidMount() {
    this.state.data.title = 'Hello';
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, button }) => {
        div(
          { id: 'root', className: 'home' },
          h1({ id: 'title', text: this.state.data.title }),
          button({
            id: 'btnNext',
            type: 'button',
            text: 'Settings',
            onClick: () => this.navigator.navigate('settings'),
          })
        );
      }
    );
    const { title } = this.ids();
    if (title) title.textContent = this.state.data.title;
  }
}
```

### 3. Wire navigation

```js
import { ComponentRender, LogEnv } from './src/engine/index.js';
import { HomePage } from './HomePage.js';
import { SettingsPage } from './SettingsPage.js';

const app = new ComponentRender({ logEnv: LogEnv.chrome });
app.init(
  { loading: 'home', home: 'home' },
  {
    home: { type: HomePage, isMount: false, isModal: false, id: 'home' },
    settings: { type: SettingsPage, isMount: false, isModal: false, id: 'settings' },
  }
);

window.addEventListener('DOMContentLoaded', () => app.render());
```

---

## Core concepts

### Lifecycle (pages and children share this)

```
mount(host) / navigate
  → adoptStyles (static styles)
  → componentDidMount(params)
  → render()
  → componentDidAttachEvents()   // window / document only; prefer on* in render

unmount / goBack
  → componentDidUnMount()        // business cleanup only
  → engine: remove on() listeners, clear host, reset refs
```

### Authoring checklist

1. `extends Component` — `state = { data, ref }` is provided.
2. Co-locate CSS: `static styles = new URL('./X.css', import.meta.url)`.
3. Build UI with `ensureShell` / `paint` + `bind` helpers — not hand-rolled `createElement` trees.
4. Put DOM handlers in props: `onClick`, `onChange`, `onPointerDown`, … (or `events: { click: fn }`).
5. Use `this.on(window, 'keydown', …)` only for non-tree targets.
6. After mount, update with `setData` / `refresh` — do not re-`navigate` to refresh.

### Composition

Parent paints host slots, children `mount`:

```js
// parent render
div({ id: 'host-panel', className: 'component-host' });

// after shell exists
await this.panel.mount('host-panel');
```

Hosts often use `display: contents` so the child’s root participates in the parent layout grid.

### Declarative DOM (`D` / `bind`)

```js
const { div, button, map, get } = bind();

div(
  { className: 'list', id: 'list' },
  ...map(
    items,
    (item, _i, key) =>
      button({ key, className: 'item', text: item.label, onClick: () => select(item) }),
    (item) => item.id
  )
);

const [ref, root] = get();
```

Inside a `Component`, prefer `ensureShell` / `paint` so you rarely call `get` + `append` yourself.

### Styles

| Layer | Where |
|-------|--------|
| Design tokens / reset / shared primitives | App-level CSS (e.g. tokens + base) |
| Component-private rules | `FooComponent.css` next to `FooComponent.js` |

`mount` injects `static styles` once per URL/text key. Unmount does **not** remove styles (shared across remounts).

---

## Repository layout

```
src/engine/          ← engine (primary)
  index.js           public exports
  component.js       Component + mount/paint/ensureShell/on
  component-render.js page stack
  element.js         D / bind / declarative on*
  styles.js          adoptStyles
  log.js

src/product/         ← example app (ProtoLive editor), not required to use the engine
docs/                deeper engine & architecture notes
skills/engine/       authoring conventions for agents / contributors
test/run.mjs         engine + example checks
index.html           boots the example product
```

Further reading:

- [`docs/engine.md`](docs/engine.md) — API detail, pitfalls, refresh rules
- [`docs/architecture.md`](docs/architecture.md) — engine vs product boundary
- [`skills/engine/README.md`](skills/engine/README.md) — short authoring skill sheet

---

## Example product (optional)

ProtoLive under `src/product/` shows a full editor composed of engine components (toolbar, palette, artboard, inspector). Useful to see composition, co-located CSS, and declarative events in a real UI.

```bash
python3 -m http.server 8080
# http://localhost:8080  → example product

node test/run.mjs
```

You can delete or ignore `src/product/` when embedding the engine in your own app.

---

## Testing

```bash
node test/run.mjs
```

No bundler; tests exercise engine APIs and guard example-product invariants.

---

## License

MIT

---

## 中文

**gd5** 是一套浏览器端的**迷你实 DOM** 组件引擎：无 Virtual DOM、无强制打包。以原生 ES Module 发布与引用；`src/product/`（ProtoLive）只是基于引擎的**示例产品**，不是主交付物。

### 怎么用

不需要 `npm run build`。在页面里：

```html
<script type="module">
  import { Component, ComponentRender, bind } from './src/engine/index.js';
</script>
```

用任意静态服务器打开（module 需要 HTTP）。可选地再做 IIFE/UMD 的 `dist` 以支持经典全局脚本，但不是默认路径。

### 开发者要点

- 页面与页内子组件共用 `mount` / `unmount`
- UI：`ensureShell` + `bind`；事件写在 props（`onClick`…）；`window` 用 `this.on`
- 样式：`static styles = new URL('./X.css', import.meta.url)`，与组件同目录
- 更新：`setData` / `refresh`，不要靠重复 `navigate`
- 详细约定见 [`docs/engine.md`](docs/engine.md)、[`skills/engine/README.md`](skills/engine/README.md)

### 示例与测试

```bash
python3 -m http.server 8080   # 打开示例产品
node test/run.mjs
```

嵌入自有应用时，只需依赖 `src/engine/`。

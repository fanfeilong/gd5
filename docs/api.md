# gd5 Engine API Reference

Canonical list of **what you can call**. For narrative guides see [`engine.md`](./engine.md) and the [README](../README.md).

Import surface:

```js
import {
  Component,
  ComponentRender,
  defaultGetUserInfo,
  Element,
  D,
  bind,
  domEventType,
  applyDomEvents,
  Log,
  LogEnv,
  adoptStyles,
  adoptStylesFor,
} from '../src/engine/index.js';
```

IDE tip: methods carry JSDoc on `src/engine/*.js` — hover / go-to-definition in the editor is the fastest lookup while coding.

---

## `Component`

Base class for pages and nested UI.

### Instance fields (after `super(deps)`)

| Member | Type | Meaning |
|--------|------|---------|
| `this.state.data` | `object` | View model; update via `setData` |
| `this.state.ref` | `{ class, id, key }` | DOM indexes filled by `paint` / `ensureShell` |
| `this.navigator` | `{ navigate, goBack, pop, refresh }` \| `null` | Page stack remote (injected for pages; forward in `deps` for children) |
| `this.logger` | `Log` \| `null` | Injected logger |

### Static

| Member | Meaning |
|--------|---------|
| `static styles` | `URL` \| CSS text \| array — co-located stylesheets; adopted once on `mount` |
| `Component.adoptStyles(spec, key?)` | Manually inject a stylesheet / CSS text |
| `Component.adoptStylesFor(Ctor)` | Adopt `Ctor.styles` |

### Lifecycle (override)

| Method | When |
|--------|------|
| `async componentDidMount(params)` | After host bound, before first `render` |
| `render()` | Build / bind DOM (`ensureShell` + data sync) |
| `componentDidAttachEvents()` | Once after first `render` — prefer `on*` in props; use `on(window, …)` here |
| `componentDidUnMount()` | Business cleanup only (engine clears host + `on()` listeners) |

### Mount / update

| Method | Meaning |
|--------|---------|
| `mount(host\|id, params?)` | Full lifecycle; pages also go through this via `ComponentRender` |
| `unmount()` | `DidUnMount` + teardown |
| `host()` | Current host element |
| `isMounted()` | Mounted flag |
| `setData(patch, { refresh? })` | Merge `state.data`; refresh default `true` |
| `refresh()` | Default: call `render()` again (no re-AttachEvents) |

### DOM helpers

| Method | Meaning |
|--------|---------|
| `paint(build, host?)` | `clear` → `bind` tree → assign `state.ref` → append |
| `ensureShell(probe, build)` | Build shell once if `probe(ids())` is falsy |
| `ids()` | `state.ref.id` |
| `keys()` | `state.ref.key` |
| `on(target, type, fn, options?)` | `addEventListener` + auto-remove on `unmount` |
| `onId(id, type, fn, options?)` | `on(ids()[id], …)` — prefer declarative `onClick` on nodes |

### `this.navigator` (when present)

| Method | Meaning |
|--------|---------|
| `navigate(name, params?)` | Push / show registered page (`isModal` keeps underlying page) |
| `goBack()` | Pop current page |
| `pop(n?)` | Pop `n` times (default 1) |
| `refresh(name?)` | Refresh mounted page (default: current) |

---

## `ComponentRender`

Owns the page registry and stack.

| Method | Meaning |
|--------|---------|
| `constructor({ getUserInfo?, logEnv?, logger? })` | Create runtime + navigator |
| `init({ loading, home }, componentsDef)` | Register pages |
| `render()` | Navigate to `home`, hide `loading` |
| `refresh(name?)` | Same as `navigator.refresh` |

### `init` registration

```js
app.init({ loading: 'boot', home: 'home' }, {
  boot: BootPage,                              // shorthand
  home: HomePage,
  preview: { type: PreviewPage, isModal: true },
});
```

| Field | Default | Meaning |
|-------|---------|---------|
| `type` | required (or shorthand class) | Component class |
| `id` | registry key | DOM slot id |
| `isMount` | `false` | Internal mount flag seed |
| `isModal` | `false` | Keep previous page visible |

Each page is constructed as `new Type({ navigator, logger })`.

---

## `D` / `bind` / `Element`

Hyperscript for real DOM.

```js
const { div, button, map, get, h } = bind();
```

| Helper | Meaning |
|--------|---------|
| `bind()` / `D.tags()` | Fresh builder + tag shortcuts |
| `div(props, ...children)` etc. | Create element; trailing children supported |
| `h(tag, props, ...children)` | Arbitrary tag |
| `map(list, render, keyOf?)` | List helper; sets `key` |
| `get()` | `[ref, rootDom]` |
| `D.clear(el)` | Remove all children |

### Element props

| Prop | Meaning |
|------|---------|
| `className` | CSS class(es); indexed on `ref.class` |
| `id` | DOM id + `ref.id` |
| `key` | Logical key + `ref.key` |
| `text` | `innerText` |
| `dataset` / `style` / `attrs` | dataset, style object/string, attributes |
| `onClick`, `onChange`, `onPointerDown`, … | Declarative listeners (`onDoubleClick` → `dblclick`) |
| `events: { click: fn }` | Extra event map |
| other | Assigned as DOM properties |

Inside a `Component`, prefer `ensureShell` / `paint` over manual `get` + `append`.

---

## Styles

| API | Meaning |
|-----|---------|
| `static styles = new URL('./X.css', import.meta.url)` | Co-located CSS |
| `adoptStyles(spec, key?)` | Inject once (URL / path / CSS text) |
| `adoptStylesFor(ComponentClass)` | Read `static styles` |

Unmount does **not** remove adopted styles.

---

## `Log` / `LogEnv`

| API | Meaning |
|-----|---------|
| `new Log(env, contexts?)` | Logger |
| `LogEnv.chrome` / `LogEnv.disable` / … | Environments |
| `log.i` / `w` / `e` / `fork()` | Emit / child logger |

---

## 中文摘要

- **查有哪些 API**：本页是权威列表；写代码时看 `src/engine` 上的 JSDoc。
- **Component**：生命周期 + `mount`/`setData`/`ensureShell`/`on*`；`this.navigator` 在页面由 `init` 注入，子组件由父写入 `deps`。
- **ComponentRender**：`init` / `render` / 页栈；注册可简写。
- **D/bind**：实 DOM；事件写在 props。
- 叙事教程仍看 [`engine.md`](./engine.md)。

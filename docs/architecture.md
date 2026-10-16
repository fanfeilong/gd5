# Architecture：产品 vs 引擎

ProtoLive 分成两层，**禁止混写**：

| 层 | 路径 | 职责 |
|----|------|------|
| **引擎 (Engine)** | `src/engine/` | 迷你实模式 DOM 运行时：`Component` / `ComponentRender` / `Element` / `D` / `Log` |
| **产品 (Product)** | `src/product/` | Live demo 原型设计工具，**必须用引擎**实现页面与导航 |

```
skills/blocks ──► product（积木数据）
                      │
                      ▼
              product components
           (extends engine.Component)
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     页面 Component   子 Component.mount(host)
   (ComponentRender)  Toolbar/Palette/Artboard/Inspector
                      │
                      ▼
              nodes/*（kind 注册表）
```

## 引擎

- `Component`：生命周期 + `setData` / `refresh` + **`mount` / `unmount`**（页面与页内同一套）
- 降噪：`ensureShell` / `paint`、`onClick` 声明式事件、`on(window)`、`ids()`
- **样式**：`static styles = new URL('./X.css', import.meta.url)`，`mount` 时 `adoptStyles` 注入一次
- `ComponentRender`：页面栈走 `component.mount(页槽)`，与子组件一致
- `D` / `bind` / `map`：实 DOM 组合

产品不得另起一套 View 生命周期绕开 `Component`。

## 产品组件怎么拆

| 类型 | 例子 | 挂载方式 |
|------|------|----------|
| 页面 | Boot / Editor / Preview | `ComponentRender` 槽 `#boot` 等 |
| 页内子组件 | Toolbar / Palette / Artboard / Inspector | 父 `render` 出 `host-*`，子 `mount(host)` |
| 节点模块 | `nodes/button.js` | 非 Component：`create` / `update` / `inspectorFields` |

`EditorComponent` 只组合：建宿主 → `child.mount` → `store.subscribe → child.refresh`。

## 目录

```
src/engine/
src/product/
  components/   # FooComponent.js + FooComponent.css 旁挂
  nodes/        # 画布 kind
  lib/
  css/          # 仅 tokens.css + base.css（全局）
  main.js
```

组件私有样式不进 `css/app.css`；共享控件（`.btn` / `.field`）放 `base.css`。

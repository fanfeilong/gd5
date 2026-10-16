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
                      ▼
              engine.ComponentRender
           navigate / goBack / modal
                      │
                      ▼
                 真实 DOM 页面槽
              #boot / #editor / #preview
```

## 引擎（不可被产品逻辑替代）

来自原 gd5 设计：

- `Component`：`componentDidMount` → `render` → `componentDidAttachEvents` / `componentDidUnMount`
- `ComponentRender`：页面栈、`navigate` / `goBack` / `pop`、模态透底
- `D` / `Element`：可组合实 DOM 构建（非 Virtual DOM）
- `Log`：环境感知日志

产品不得再发明第二套页面导航或生命周期。

## 产品

- `BootComponent` → loading 槽
- `EditorComponent` → home：壳 / 面板 / 画布节点用 `D` 构建，画布数据在 `state` + store
- `PreviewComponent` → `isModal: true`，`navigate('preview', { doc })` / `goBack()`
- 产品层优先 `D`，不用 `innerHTML` / 零散 `createElement` 拼 UI（相对 JSX：无编译，靠 `key`+多 class 把 DSL 用满）

## 目录

```
docs/
src/engine/          # 引擎
src/product/         # 产品
  components/
  lib/
  css/
  main.js
skills/blocks/       # 产品积木
skills/engine/       # 引擎使用约定
test/
index.html           # 仅页面槽 + 挂载 product/main.js
```

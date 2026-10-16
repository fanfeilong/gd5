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

**页面组件**（进 `ComponentRender` 栈）只做组合；**视图 / 节点** 一模块一事。

| 层 | 路径 | 职责 |
|----|------|------|
| 页面 | `components/*Component.js` | 导航槽：boot / editor / preview |
| 视图 | `views/*View.js` | Toolbar / Palette / Artboard / Inspector |
| 节点 | `nodes/*.js` | 每种画布 kind：`create` / `update` / `inspectorFields` |

`EditorComponent` 只：`shell` 组合子视图、`attach` 转发、`subscribe → paint`。  
kind 分支与属性表单条件不进 Editor，进 `nodes/` 注册表。

## 目录

```
docs/
src/engine/          # 引擎
src/product/
  components/        # 页面组件（薄）
  views/             # 可组合视图
  nodes/             # 画布节点 kind
  lib/
  css/
  main.js
skills/blocks/
skills/engine/
test/
index.html
```

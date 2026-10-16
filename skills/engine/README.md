# Engine skills

编写 / 扩展 ProtoLive **产品页**时遵循的引擎约定。

## Skill：新建页面组件

1. `extends Component`
2. `this.state = { data, ref }`
3. `render()` 里用 `D` 构建，把节点索引进 `this.state.ref`
4. 事件只写在 `componentDidAttachEvents`
5. `componentDidUnMount` 清理 DOM / 监听器（可用 `D.clear`）
6. Mount 后改数据用 `setData` / `refresh`，不要重复 `navigate`

## Skill：可刷新 render

```js
render() {
  if (!this.state.ref.id?.root) {
    // 首次：D 建壳，写入 this.state.ref
  }
  // 每次（含 refresh）：把 this.state.data 绑到 ref
}

// 之后
this.setData({ message: 'updated' });
```

## Skill：产品页要薄，靠 Component 组合

- 页面与页内模块**都是** `extends Component`，不要另造 View 生命周期
- 父组件 `render` 出宿主，子组件 `mount(host)` / `unmount()` / `refresh()`
- 一组件一事：Toolbar / Palette / Artboard / Inspector 各一个 Component
- 画布 kind 用 `nodes/*` 注册表（`create` / `update` / `inspectorFields`），禁止在 Editor 里 `switch (kind)`

## Skill：模态页

在 `ComponentRender.init` 里设 `isModal: true`。  
打开：`navigator.navigate('name', params)`；关闭：`navigator.goBack()`。  
底层页不会被隐藏。

## Skill：实 DOM 组合（优先 D，少手写 DOM）

```js
import { bind } from '../../src/engine/index.js';

const { div, button, map, get } = bind();

div({ className: 'box', id: 'box' },
  div({ className: 'title panel-title', text: 'Hello' }),
  ...map(
    items,
    (item, _i, key) =>
      button({ key, className: 'palette-item', dataset: { skillId: item.id }, text: item.label }),
    (item) => item.id,
  ),
);

const [ref, root] = get();
host.appendChild(root);
```

- 尾参 children，少写 `.childList`
- `bind()` 解构短名，少写 `d.`
- 列表用 `map(..., keyOf)`，少手写 `key`
- 先建根再挂子节点，避免抢 `D.root`
- 避免 `innerHTML` / 零散 `createElement`

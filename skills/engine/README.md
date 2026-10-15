# Engine skills

编写 / 扩展 ProtoLive **产品页**时遵循的引擎约定。

## Skill：新建页面组件

1. `extends Component`
2. `this.state = { data, ref }`
3. `render()` 里用 `D` 构建，把节点索引进 `this.state.ref`
4. 事件只写在 `componentDidAttachEvents`
5. `componentDidUnMount` 清理 DOM / 监听器（可用 `D.clear`）

## Skill：模态页

在 `ComponentRender.init` 里设 `isModal: true`。  
打开：`navigator.navigate('name', params)`；关闭：`navigator.goBack()`。  
底层页不会被隐藏。

## Skill：实 DOM 组合

```js
const d = new D();
d.div({ className: 'box', id: 'box' }).childList([
  d.div({ className: 'title', text: 'Hello' }),
]);
const [ref, root] = d.get();
host.appendChild(root);
```

同一次 `D` 构建中 `className` / `id` 不可重复。

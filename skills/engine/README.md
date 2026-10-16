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

## Skill：模态页

在 `ComponentRender.init` 里设 `isModal: true`。  
打开：`navigator.navigate('name', params)`；关闭：`navigator.goBack()`。  
底层页不会被隐藏。

## Skill：实 DOM 组合（优先 D，少手写 DOM）

```js
const d = new D();
d.div({ className: 'box', id: 'box' }).childList([
  d.div({ className: 'title panel-title', text: 'Hello' }), // 多 class OK
]);
const [ref, root] = d.get();
host.appendChild(root);
```

列表：

```js
items.forEach((item) => {
  const row = new D();
  row.button({
    key: item.id,
    className: 'palette-item',
    dataset: { skillId: item.id },
    text: item.label,
  });
  host.appendChild(row.get()[1]);
});
```

- 用 `key` / `id` 做索引，`className` 只表达样式
- 先建根节点再 `childList`，避免子节点抢占 `D.root`
- 产品里避免 `innerHTML` / 零散 `createElement`（导出下载链等边界除外）

# Engine skills

编写 / 扩展 ProtoLive **产品页**时遵循的引擎约定。

## Skill：新建组件（页面或页内）

1. `extends Component`（基类已带 `state = { data, ref }`）
2. 旁挂 **`MyPanel.css`**，声明 `static styles = new URL('./MyPanel.css', import.meta.url)`
3. `render()` 用 **`ensureShell`** 建壳，不要手写 clear/bind/get/append
4. 事件只用 **`on` / `onId`**（写在 `componentDidAttachEvents`）
5. `componentDidUnMount` 只清业务（订阅、定时器）；**不必** `D.clear(host)`
6. Mount 后改数据用 `setData` / `refresh`，不要重复 `navigate`

```js
export class MyPanel extends Component {
  static styles = new URL('./MyPanel.css', import.meta.url);

  componentDidAttachEvents() {
    this.onId('btn', 'click', () => this.doIt());
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, button }) => {
        div({ id: 'root', className: 'panel' },
          button({ id: 'btn', type: 'button', text: 'Go' })
        );
      }
    );
  }
}
```

全局只放 `css/tokens.css` + `css/base.css`；组件私有 class 写在旁挂 CSS，不要堆回 `app.css`。

## Skill：可刷新 render

```js
render() {
  this.ensureShell((ids) => ids.root, ({ div }) => {
    div({ id: 'root' }, /* 静态壳 */);
  });
  // 每次（含 refresh）：把 state.data 绑到 ids()
  const { title } = this.ids();
  if (title) title.textContent = this.state.data.title;
}
```

动态列表可局部清节点再画；**不要**在 refresh 路径 `paint` 整棵壳（会丢掉 AttachEvents）。

## Skill：产品页要薄，靠 Component 组合

- 页面与页内模块**都是** `extends Component`
- 父组件 `ensureShell` 出宿主，子组件 `mount(host)` / `unmount()` / `refresh()`
- 一组件一事：Toolbar / Palette / Artboard / Inspector
- 画布 kind 用 `nodes/*` 注册表，禁止在 Editor 里 `switch (kind)`

## Skill：模态页

在 `ComponentRender.init` 里设 `isModal: true`。  
打开：`navigator.navigate('name', params)`；关闭：`navigator.goBack()`。

## Skill：实 DOM 组合

- 组件内优先 `ensureShell` / `paint`
- 节点模块等非 Component 处再用 `bind()` + `get()`
- 尾参 children、`map(..., keyOf)`；避免 `innerHTML`

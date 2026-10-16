# gd5 UI — Component library

Ant Design–style **UI kit on top of the engine**. Prefer these over raw `div` + one-off CSS for common chrome.

**Default theme:** orange primary on a **light-orange** surface (`--gd-*` in `src/ui/css/tokens.css`).

```
Engine (runtime)     →  src/engine/
UI kit (components)  →  src/ui/
App / product        →  your code or src/product/
```

## Install

No build. Link styles (or `await loadUi()`), then import:

```html
<link rel="stylesheet" href="./src/ui/css/ui.css">
<script type="module">
  import { Button, Input, Modal, loadUi } from './src/ui/index.js';
</script>
```

## Usage (inside a Component)

```js
import { Button, Space, Card, Input, Field } from '../ui/index.js';

render() {
  this.ensureShell((ids) => ids.root, ({ div }) => {
    div(
      { id: 'root' },
      Card(
        { title: 'Profile' },
        Space(
          { direction: 'vertical' },
          Field({ label: 'Name', control: Input({ id: 'name' }) }),
          Button({
            type: 'primary',
            text: 'Save',
            onClick: () => this.save(),
          })
        )
      )
    );
  });
}
```

Primitives return **real-DOM `Element`s** — valid children of `ensureShell` / `bind` trees.

## Catalog (v1)

| Component | Kind | Notes |
|-----------|------|--------|
| `Button` | primitive | `type`: primary / default / ghost / danger / text; `size`: sm / md / lg |
| `Input` / `TextArea` / `Select` | primitive | Form controls |
| `Checkbox` / `Switch` | primitive | Boolean controls (orange when on) |
| `Badge` | primitive | count / dot / status |
| `Field` | primitive | Label + control + hint |
| `Space` / `Divider` | primitive | Layout |
| `Title` / `Text` | primitive | Typography |
| `Card` | primitive | title / extra / footer |
| `Tag` / `Alert` / `Spin` / `Empty` | primitive | Feedback |
| `Modal` | **Component** | `mount` + `open()` / `close()` |

Live gallery: [`examples/ui-gallery.html`](../examples/ui-gallery.html)

## Modal

```js
const modal = new Modal({ navigator: this.navigator, logger: this.logger });
await modal.mount(); // portal under document.body (does not clear the page)
modal.open({
  title: 'Delete?',
  content: 'This cannot be undone.',
  onOk: () => this.remove(),
});
```

## Theming

Default is orange / light-orange. Override on `:root`:

```css
:root {
  --gd-primary: #e86a17;
  --gd-bg: #fff8f1;
  --gd-bg-container: #fff3e8;
  --gd-primary-soft: rgba(232, 106, 23, 0.14);
}
```

## 中文

- 引擎 = 运行时；**组件库** = `src/ui/`（对标 antd 常用件）
- **默认配色：橙色主色 + 浅橙背景**
- 基础件是函数，返回实 DOM，可放进 `ensureShell`
- `Modal` 是 `Component`
- 画廊：`examples/ui-gallery.html`

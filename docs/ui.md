# gd5 UI — Component library

Ant Design–style **UI kit on top of the engine**. Catalog aligned with [NameThatUI](https://namethatui.com/) **web** elements **and** [Ant Design](https://ant.design/components/overview) controls (macOS-only chrome maps to the closest web control).

**Default theme:** orange primary, **white panels**, soft warm page (`--gd-*` in `src/ui/css/tokens.css`).

```
Engine (runtime)     →  src/engine/
UI kit (components)  →  src/ui/
App / product        →  your code or src/product/
```

## Install

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
          Button({ type: 'primary', text: 'Save', onClick: () => this.save() })
        )
      )
    );
  });
}
```

Primitives return **real-DOM `Element`s**. Overlay widgets are **`Component`s** with portal `mount()`.

## Catalog ↔ NameThatUI

| NameThatUI (web) | gd5 export | Kind |
|------------------|------------|------|
| Accordion / Disclosure | `Accordion`, `Collapse` | primitive |
| Alert / Callout / Banner | `Alert`, `Callout`, `Banner` | primitive |
| Avatar Group / Status Dot | `Avatar`, `AvatarGroup`, `StatusDot` | primitive |
| Badge / Chip / Pill / Tag | `Badge`, `Chip`, `Pill`, `Tag` | primitive |
| Bento Grid / Masonry | `BentoGrid`, `BentoTile`, `Masonry` | primitive |
| Bottom Navigation | `BottomNav` | primitive |
| Breadcrumbs | `Breadcrumbs` | primitive |
| Card | `Card` | primitive |
| Carousel / Page Control | `Carousel`, `PageControl` | primitive |
| Chat Bubble | `ChatBubble` | primitive |
| Combobox | `Combobox` | primitive |
| Command Palette | `CommandPalette` | **Component** |
| Data Table | `Table` / `DataTable` | primitive |
| Date / Time pickers | `DatePicker`, `TimeField` | primitive |
| Divider / Separator | `Divider` | primitive |
| Drag & Drop cues | `DragHandle`, `DropZone` | primitive |
| Empty State | `Empty` | primitive |
| Floating buttons | `Fab`, `ChatLauncher`, `BackToTop` | primitive |
| Focus ring | `.gd-focus-ring` | CSS |
| Form Field | `Field`, `Input`, `TextArea`, `Select` | primitive |
| Hamburger / Nav Drawer | `HamburgerButton`, `Drawer` | mixed |
| Header / Navbar | `SiteHeader`, `Navbar` | primitive |
| Hover Card | `HoverCard` | primitive |
| Lightbox | `Lightbox` | **Component** |
| Marquee | `Marquee` | primitive |
| Modal / Dialog | `Modal` | **Component** |
| Drawer / Sheet | `Drawer`, `Sheet` | **Component** |
| Multi-select / Transfer | `MultiSelect`, `Transfer`, `TagInput` | primitive |
| Overflow / Three dots | `OverflowMenu` | primitive |
| Pagination | `Pagination` | primitive |
| Pie / Donut Chart | `PieChart`, `DonutChart` | primitive |
| Popover / Dropdown / Tooltip | `Popover`, `DropdownMenu`, `Tooltip` | primitive |
| Context Menu | `ContextMenu` | primitive |
| Progress / Spinner | `ProgressBar`, `ProgressRing`, `Spin`, `Meter` | primitive |
| Resize Handle | `ResizeHandle` | primitive |
| Scrim | `Scrim` | primitive |
| Scroll Area / Sticky / Fixed | `ScrollArea`, `Sticky`, `Fixed` | primitive |
| Scrollspy | `Scrollspy` | primitive |
| Search Field | `SearchInput` | primitive |
| Sidebar | `Sidebar` | primitive |
| Sign-in Form | `SignInForm`, `PasswordInput`, `OrDivider` | primitive |
| Skeleton | `Skeleton`, `SkeletonParagraph` | primitive |
| Slider / Color Well | `Slider`, `ColorWell` | primitive |
| Split View | `Splitter` / `SplitView` | primitive |
| Split Button | `SplitButton` | primitive |
| Steps / Quantity Stepper | `Steps`, `QuantityStepper` | primitive |
| Switch / Checkbox / Radio | `Switch`, `Checkbox`, `Radio`, `RadioGroup` | primitive |
| Tabs / Toggle Group | `Tabs`, `ToggleGroup`, `SegmentedControl` | primitive |
| Timeline | `Timeline` | primitive |
| Toast / Snackbar | `Toast` | **Component** |
| Toolbar | `Toolbar` | primitive |
| Tree / Outline / Disclosure | `Tree`, `OutlineView`, `DisclosureTriangle` | primitive |
| Truncation | `Truncate` | primitive |
| Typography | `Title`, `Text` | primitive |
| Button | `Button` | primitive |

### Ant Design coverage (gap fill)

| Ant Design | gd5 export |
|------------|------------|
| InputNumber | `InputNumber` |
| Rate | `Rate` |
| Cascader | `Cascader` |
| Upload | `Upload` |
| Mentions | `Mentions` |
| TreeSelect | `TreeSelect` |
| Form / Form.Item | `Form`, `FormItem` |
| List | `List`, `ListItem` |
| Descriptions | `Descriptions` |
| Statistic | `Statistic` |
| Calendar | `Calendar` |
| Image | `Image` (+ `Lightbox` for preview) |
| Result | `Result` |
| Popconfirm | `Popconfirm` |
| Notification / message | `Notification`, `messageApi` |
| Watermark | `Watermark` |
| Flex | `Flex` |
| Grid (Row/Col) | `Row`, `Col` |
| Layout | `Layout`, `LayoutHeader`, `LayoutSider`, `LayoutContent`, `LayoutFooter` |
| Menu | `Menu` |
| Affix | `Affix` |
| Anchor | `Anchor` |
| Icon | `Icon` |
| ConfigProvider | `ConfigProvider` |

**Still not shipped** (intentionally light / app-level): Tour, QRCode, App shell runtime, BorderBeam, ProComponents. Motion/vibe-only NameThatUI entries remain CSS/app concerns.

**Not shipped as components** (CSS motion / vibe, not controls): easing, spring, text scramble, parallax, hover-lift effects, Name That Vibe styles. Use CSS / your app layer.

Live gallery: [`examples/ui-gallery.html`](../examples/ui-gallery.html)

## Modal / Drawer / Toast

```js
const modal = new Modal({});
await modal.mount();
modal.open({ title: 'Delete?', content: 'Cannot undo.', onOk: () => {} });

const drawer = new Drawer({});
await drawer.mount();
drawer.open({ title: 'Menu', placement: 'left', content: '…' });

const toast = new Toast({});
await toast.mount();
toast.show({ message: 'Saved', type: 'success' });
```

## Theming

```css
:root {
  --gd-primary: #e86a17;
  --gd-bg: #f7f4f0;
  --gd-bg-elevated: #ffffff;
  --gd-bg-container: #ffffff;
}
```

## 中文

- 引擎 = 运行时；**组件库** = `src/ui/`（对标 [antd](https://ant.design/components/overview) + [NameThatUI](https://namethatui.com/) Web 清单）
- **默认配色：橙色主色 + 白色面板**
- 基础件返回实 DOM；`Modal` / `Drawer` / `Toast` / `Notification` / `Lightbox` / `CommandPalette` 是 `Component`
- 画廊：`examples/ui-gallery.html`

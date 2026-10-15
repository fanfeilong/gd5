# Skills

`skills/blocks` 存放可复用的原型积木（JSON）。ProtoLive 启动时读取 `manifest.json`，把每个 block 挂到左侧组件面板。

## Block 字段

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，拖放时使用 |
| `kind` | 渲染类型：`text` / `button` / `input` / `card` / `image` / `navbar` |
| `label` | 面板显示名称 |
| `icon` | 短标签 |
| `defaults` | 默认宽高、`props`、`style` |

## 新增积木

1. 在 `skills/blocks/` 增加 `my-block.json`
2. 把文件名写入 `manifest.json` 的 `blocks` 数组
3. 刷新页面即可

若 `fetch` 失败（例如直接打开 `file://`），应用会回退到内置 fallback 积木，保证本地仍可演示。

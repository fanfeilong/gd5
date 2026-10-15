# Skills

两类 skill：

| 目录 | 归属 | 内容 |
|------|------|------|
| `skills/engine/` | 引擎 | 如何用 `Component` / `D` / 导航写产品页 |
| `skills/blocks/` | 产品 | 编辑器左侧可拖积木（JSON） |

## 产品积木（blocks）

启动时读取 `blocks/manifest.json`。字段：`id` / `kind` / `label` / `icon` / `defaults`。

新增：加 JSON → 写入 manifest → 刷新。`fetch` 失败时产品回退到内置 fallback。

## 引擎约定

见 [engine/README.md](./engine/README.md)。

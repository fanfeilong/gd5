# Usage

## 启动

需要本地静态服务器（ES modules 无法直接用 `file://` 可靠加载）：

```bash
# Python
python3 -m http.server 8080

# 或 Node
npx --yes serve -p 8080
```

打开 http://localhost:8080 。

## 基本操作

| 操作 | 方式 |
|------|------|
| 添加组件 | 点击左侧积木，或拖到画布 |
| 选中 / 移动 | 点击并拖动节点 |
| 编辑属性 | 右侧面板修改文本、尺寸、颜色 |
| 调整画布 | 右侧「画布宽度 / 高度」 |
| 预览 | 顶部「预览」 |
| 导出 | 顶部「导出 HTML」得到独立页面 |
| 撤销 / 重做 | 工具栏按钮，或 `Ctrl/Cmd+Z` / `Ctrl/Cmd+Y` |
| 删除 | `Delete` / `Backspace` |

## 扩展积木

见 [skills/README.md](../skills/README.md)。

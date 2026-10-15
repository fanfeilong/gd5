# Usage

## 启动

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## 产品操作

| 操作 | 方式 |
|------|------|
| 添加组件 | 点击或拖左侧积木 |
| 编辑属性 | 选中节点后改右侧面板 |
| 预览 | 顶部「预览」→ 引擎 `navigate('preview')` |
| 关闭预览 | 「关闭」或 Esc → `goBack()` |
| 导出 | 「导出 HTML」 |

## 用引擎写新产品页

1. 在 `index.html` 增加 `<div id="myPage">`
2. `class MyPage extends Component { ... }`
3. 在 `src/product/main.js` 的 `componentsDef` 注册
4. `navigator.navigate('myPage', params)`

详见 [engine.md](./engine.md) 与 [skills/engine/](../skills/engine/)。

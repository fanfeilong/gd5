# ProtoLive

纯 **HTML + CSS + JavaScript** 的 live demo 原型设计工具。在浏览器里拖积木、改属性、即时预览，并导出可独立打开的 HTML。

## 目录结构

```
docs/       架构与使用说明
src/        编辑器源码（css / js）
skills/     可复用原型积木
test/       单元测试
index.html  入口
```

## 快速开始

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 能力一览

- 画布编辑：文本、按钮、输入框、卡片、占位图、导航栏
- Live Preview：一键预览当前原型
- 导出 HTML：生成不依赖本工具的独立页面
- 撤销 / 重做与属性检查器

更多说明见 [docs/usage.md](docs/usage.md) 与 [docs/architecture.md](docs/architecture.md)。

## 测试

```bash
node test/run.mjs
```

## License

MIT

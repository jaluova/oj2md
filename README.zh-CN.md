<p align="center">
  <img src="icons/icon128.png" width="96" alt="OJ2MD">
</p>

<h1 align="center">OJ2MD</h1>

<p align="center">
  一键将 OJ（Online Judge）题目复制为 Markdown 的浏览器扩展
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Chrome-Extension-1A5CC8?logo=googlechrome" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Firefox-Addon-FF7139?logo=firefox" alt="Firefox Addon">
  <img src="https://img.shields.io/badge/Manifest-V3-1A5CC8" alt="Manifest V3">
  <a href="https://star-history.com/#jaluova/oj2md&Date">
    <img src="https://img.shields.io/github/stars/jaluova/oj2md?style=social" alt="GitHub stars">
  </a>
</p>

[English](README.md) | 简体中文

---

## 功能

-   **一键复制** — 右下角可拖动的悬浮图标，点击复制，或通过扩展 popup 一键复制
-   **完整格式** — 自动提取标题、时间/内存限制、题目描述、输入输出、样例等，转换为规范 Markdown
-   **数学公式还原** — 自动识别 KaTeX / MathJax 公式并还原为 `$...$` / `$$...$$` LaTeX 格式
-   **多平台支持** — 已支持 HDU OJ / Codeforces / AtCoder，可无限扩展
-   **跨浏览器** — 同时兼容 Chrome 和 Firefox（Manifest V3）
-   **🤖 AI 辅助扩展** — 内置 Claude Code Skill，一句命令即可添加新 OJ 平台

## 安装

### 从 Release 下载（推荐）

前往 [Releases](https://github.com/jaluova/oj2md/releases) 下载最新 `oj2md-v*.zip`，解压后加载。

### Chrome / Edge / Brave 等

1.  打开 `chrome://extensions/`（Edge: `edge://extensions/`）
2.  开启右上角 **开发者模式**
3.  点击 **加载已解压的扩展程序**，选择项目目录
4.  完成！

### Firefox

1.  打开 `about:debugging#/runtime/this-firefox`
2.  点击 **临时加载附加组件...**
3.  选择 `manifest.json`
4.  完成！

> **注意**：Chrome 从 v70 起禁止安装非商店来源的 `.crx` 文件。如需分发，请使用「加载已解压」方式或发布到 [Chrome Web Store](https://chrome.google.com/webstore/devconsole)。

## 使用

打开支持的 OJ 题目页面，右下角会出现 OJ2MD 图标：

1.  点击图标 → 自动解析并复制 Markdown 到剪贴板
2.  长按拖拽可移动图标位置
3.  或者在工具栏点击 **OJ2MD 图标** → 弹出面板 → 点击 **Copy as Markdown**

粘贴效果：

````markdown
# A + B Problem

> **Time Limit:** 1000MS | **Memory Limit:** 32768K
> Total Submission(s): 123,456 | Accepted Submission(s): 45,678

## Problem Description

Calculate A + B.

## Input

Each line will contain two integers A and B. ...

## Output

For each case, output A + B in one line.

## Sample Input

```
1 2
3 4
```

## Sample Output

```
3
7
```

---

*Source: [HDU OJ](http://acm.hdu.edu.cn/showproblem.php?pid=1000)*
````

## 支持的平台

| 平台 | URL 模式 | 数学公式 |
|------|---------|---------|
| [HDU OJ](http://acm.hdu.edu.cn) | `showproblem.php` / `contest/problem` | KaTeX |
| [Codeforces](https://codeforces.com) | `/problemset/problem/*` / `/contest/*/problem/*` / `/gym/*/problem/*` | MathJax |
| [AtCoder](https://atcoder.jp) | `/contests/*/tasks/*` | KaTeX |

欢迎贡献新平台 Parser！

### 🤖 AI 辅助创建（推荐）

本项目内置了 **Claude Code Skill** — 你只需要提供一个 OJ 题目页的 URL，AI 会自动分析页面结构、生成 Parser、注册并配置权限：

```
/add-parser https://example-oj.com/problem/123
```

Skill 会：
1. 分析页面 DOM（标题/限制/描述/输入输出/样例/数学公式）
2. 自动创建 `parsers/xxx-parser.js`
3. 注册到 `parser-registry.js` 并更新 `manifest.json`
4. 处理 KaTeX / MathJax 等数学公式还原

### 📝 手动创建

项目架构基于 **Parser 插件机制**，手动添加也只需 3 步：

<details>
<summary>展开手动步骤</summary>

#### 1. 创建 Parser

复制 `parsers/_template.js`，实现 `detect()` / `parse()` / `ojName`：

```js
class XxxParser extends BaseParser {
  static get ojName() { return 'XXX OJ'; }

  static detect(url, doc) {
    return url.includes('xxxoj.com') && doc.querySelector('.problem');
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.title = doc.querySelector('h1').textContent.trim();
    // ...填充 model 各字段...
    return model;
  }
}
```

#### 2. 注册 Parser

在 `content/parser-registry.js` 中添加到注册表：

```js
const PARSER_REGISTRY = [HduParser, CfParser, AtCoderParser, XxxParser];
```

#### 3. 配置权限

在 `manifest.json` 中添加域名到 `host_permissions` 和 `content_scripts.matches`。

</details>

## 架构

```
oj2md/
├── core/
│   ├── problem-model.js      # 题目数据模型
│   └── markdown-renderer.js  # Markdown 渲染引擎（HTML→MD、KaTeX/MathJax 还原）
├── parsers/
│   ├── base-parser.js        # Parser 基类（接口定义）
│   ├── hdu-parser.js         # HDU OJ 解析器
│   ├── cf-parser.js          # Codeforces 解析器
│   ├── atcoder-parser.js     # AtCoder 解析器
│   └── _template.js          # 新 Parser 模板
├── content/
│   ├── content.js            # 内容脚本（可拖动悬浮按钮、消息处理）
│   ├── parser-registry.js    # Parser 注册表
│   └── content.css           # 悬浮按钮 & Toast 样式
├── utils/
│   ├── clipboard.js          # 剪贴板工具（Clipboard API + execCommand 降级）
│   ├── toast.js              # Toast 通知组件
│   └── encoding.js           # 编码处理
├── popup/
│   ├── popup.html            # 扩展弹窗 UI
│   └── popup.js              # 弹窗逻辑
├── scripts/
│   └── build-crx.js          # CRX3 打包工具（可选）
├── .github/workflows/
│   └── release.yml           # 自动构建 Release
├── .claude/skills/
│   └── add-parser/           # AI 辅助创建 Parser
├── icons/                    # 图标资源
└── manifest.json             # 扩展清单 (Manifest V3)
```

## 星标增长

[![Star History Chart](https://api.star-history.com/svg?repos=jaluova/oj2md&type=Date)](https://star-history.com/#jaluova/oj2md&Date)

## License

[MIT](LICENSE) © 2026 jaluova

<p align="center">
  <img src="icons/icon128.png" width="96" alt="OJ2MD">
</p>

<h1 align="center">OJ2MD</h1>

<p align="center">
  一键将 OJ（Online Judge）题目复制为 Markdown 的 Chrome 扩展
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Chrome-Extension-1A5CC8?logo=googlechrome" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-1A5CC8" alt="Manifest V3">
  <a href="https://star-history.com/#jaluova/oj2md&Date">
    <img src="https://img.shields.io/github/stars/jaluova/oj2md?style=social" alt="GitHub stars">
  </a>
</p>

## 功能 / Features

-   **一键复制** — 在题目页面右下角点击悬浮按钮，或通过扩展 popup 点击复制
-   **完整格式** — 自动提取标题、时间/内存限制、题目描述、输入输出、样例等，转换为规范 Markdown
-   **KaTeX 数学公式** — 自动识别页面中的 KaTeX 公式并还原为 `$...$` / `$$...$$` LaTeX 格式
-   **双端兼容** — 同时支持 HDU OJ 旧版（`showproblem.php`）和新版（`contest/problem`）前端
-   **可扩展架构** — 通过 Parser 插件机制轻松接入更多 OJ 平台

## 安装 / Installation

### Chrome 应用店

<!-- 待上架 -->
> 即将上架 Chrome Web Store，敬请期待。

### 开发者模式（手动加载）

1.  克隆或下载本仓库
    ```bash
    git clone https://github.com/jaluova/oj2md.git
    ```
2.  打开 Chrome，进入 `chrome://extensions/`
3.  开启右上角 **开发者模式**
4.  点击 **加载已解压的扩展程序**，选择 `oj2md` 项目目录
5.  完成！打开 [HDU OJ 题目页](http://acm.hdu.edu.cn/showproblem.php?pid=1000) 试一下

## 使用 / Usage

打开支持的 OJ 题目页面，右下角会出现一个蓝色 **MD** 按钮：

1.  点击 **MD** 按钮 → 自动解析并复制 Markdown 到剪贴板
2.  或者在工具栏点击 **OJ2MD 图标** → 弹出面板 → 点击 **Copy as Markdown**

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

## 支持的 OJ / Supported Platforms

| 平台 | 旧版前端 | 新版前端 | 状态 |
|------|---------|---------|------|
| [HDU OJ](http://acm.hdu.edu.cn) | `showproblem.php` | `contest/problem` | ✅ 已支持 |

欢迎贡献新平台 Parser！参见下方 [扩展指南](#扩展新平台)。

## 扩展新平台 / Add a New OJ

项目架构基于 **Parser 插件机制**，为新的 OJ 平台添加支持只需 3 步：

### 1. 创建 Parser

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

### 2. 注册 Parser

在 `content/parser-registry.js` 中添加到注册表：

```js
const PARSER_REGISTRY = [HduParser, XxxParser];
```

### 3. 配置权限

在 `manifest.json` 中添加域名到 `host_permissions` 和 `content_scripts.matches`。

## 架构 / Architecture

```
oj2md/
├── core/
│   ├── problem-model.js      # 题目数据模型
│   └── markdown-renderer.js  # Markdown 渲染引擎（HTML→MD、KaTeX 还原）
├── parsers/
│   ├── base-parser.js        # Parser 基类（接口定义）
│   ├── hdu-parser.js         # HDU OJ 解析器
│   └── _template.js          # 新 Parser 模板
├── content/
│   ├── content.js            # 内容脚本（注入页面、悬浮按钮、消息处理）
│   ├── parser-registry.js    # Parser 注册表
│   └── content.css           # 悬浮按钮 & Toast 样式
├── utils/
│   ├── clipboard.js          # 剪贴板工具（Clipboard API + execCommand 降级）
│   ├── toast.js              # Toast 通知组件
│   └── encoding.js           # 编码处理
├── popup/
│   ├── popup.html            # 扩展弹窗 UI
│   └── popup.js              # 弹窗逻辑
├── icons/                    # 图标资源
└── manifest.json             # Chrome 扩展清单 (Manifest V3)
```

## 星标增长 / Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jaluova/oj2md&type=Date)](https://star-history.com/#jaluova/oj2md&Date)

## License

[MIT](LICENSE) © 2026 jaluova

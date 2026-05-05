<p align="center">
  <img src="icons/icon128.png" width="96" alt="OJ2MD">
</p>

<h1 align="center">OJ2MD</h1>

<p align="center">
  One-click browser extension to copy Online Judge problems as clean Markdown
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

[简体中文](README.zh-CN.md) | English

---

## Features

-   **One-click copy** — Click the draggable floating icon, or use the toolbar popup
-   **Clean Markdown output** — Title, time/memory limits, description, input/output, samples — all properly formatted
-   **Math formula preservation** — Auto-detects KaTeX & MathJax, restores `$...$` / `$$...$$` LaTeX
-   **Multi-platform** — HDU OJ / Codeforces / AtCoder, extensible to any OJ
-   **Cross-browser** — Works on Chrome and Firefox (Manifest V3)
-   **🤖 AI-powered extension** — Built-in Claude Code skill: one command to add a new OJ

## Installation

### From Release (recommended)

Download the latest `oj2md-v*.zip` from [Releases](https://github.com/jaluova/oj2md/releases), unzip, and load.

### Chrome / Edge / Brave

1.  Open `chrome://extensions/` (Edge: `edge://extensions/`)
2.  Enable **Developer mode** (top-right toggle)
3.  Click **Load unpacked**, select the project directory
4.  Done!

### Firefox

1.  Open `about:debugging#/runtime/this-firefox`
2.  Click **Load Temporary Add-on…**
3.  Select `manifest.json`
4.  Done!

> **Note**: Chrome 70+ blocks sideloaded `.crx` files. Use "Load unpacked" or publish to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole).

## Usage

Visit any supported OJ problem page. The OJ2MD icon appears at the bottom-right:

1.  **Click** the icon → Markdown is copied to clipboard
2.  **Long-press & drag** to reposition the icon
3.  Or click the **OJ2MD toolbar icon** → popup → **Copy as Markdown**

Example output:

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

## Supported Platforms

| Platform | URL Patterns | Math |
|----------|-------------|------|
| [HDU OJ](http://acm.hdu.edu.cn) | `showproblem.php` / `contest/problem` | KaTeX |
| [Codeforces](https://codeforces.com) | `/problemset/problem/*` / `/contest/*/problem/*` / `/gym/*/problem/*` | MathJax |
| [AtCoder](https://atcoder.jp) | `/contests/*/tasks/*` | KaTeX |

Contributions welcome!

### 🤖 AI-Assisted (recommended)

This project includes a **Claude Code Skill** — provide a problem URL and AI handles everything:

```
/add-parser https://example-oj.com/problem/123
```

The skill:
1. Analyzes the page DOM (title, limits, sections, samples, math)
2. Creates `parsers/xxx-parser.js`
3. Registers the parser and updates `manifest.json`
4. Handles KaTeX / MathJax extraction

### 📝 Manual

The project uses a **Parser plugin architecture**. Adding a new OJ takes 3 steps:

<details>
<summary>Expand for manual steps</summary>

#### 1. Create a Parser

Copy `parsers/_template.js` and implement `detect()` / `parse()` / `ojName`:

```js
class XxxParser extends BaseParser {
  static get ojName() { return 'XXX OJ'; }

  static detect(url, doc) {
    return url.includes('xxxoj.com') && doc.querySelector('.problem');
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.title = doc.querySelector('h1').textContent.trim();
    // ...populate model fields...
    return model;
  }
}
```

#### 2. Register the Parser

Add to `content/parser-registry.js`:

```js
const PARSER_REGISTRY = [HduParser, CfParser, AtCoderParser, XxxParser];
```

#### 3. Update Permissions

Add the domain to `host_permissions` and `content_scripts.matches` in `manifest.json`.

</details>

## Architecture

```
oj2md/
├── core/
│   ├── problem-model.js      # Problem data model
│   └── markdown-renderer.js  # HTML→Markdown, KaTeX/MathJax extraction
├── parsers/
│   ├── base-parser.js        # Parser interface
│   ├── hdu-parser.js         # HDU OJ
│   ├── cf-parser.js          # Codeforces
│   ├── atcoder-parser.js     # AtCoder
│   └── _template.js          # Parser template
├── content/
│   ├── content.js            # Draggable floating button + messaging
│   ├── parser-registry.js    # Parser registry
│   └── content.css           # Button & toast styles
├── utils/
│   ├── clipboard.js          # Clipboard API + execCommand fallback
│   ├── toast.js              # Toast notification
│   └── encoding.js           # Encoding utilities
├── popup/
│   ├── popup.html            # Extension popup UI
│   └── popup.js              # Popup logic
├── scripts/
│   └── build-crx.js          # CRX3 packager (optional)
├── .github/workflows/
│   └── release.yml           # Automated release builds
├── .claude/skills/
│   └── add-parser/           # AI-assisted parser creation
├── icons/                    # Icon assets
└── manifest.json             # Extension manifest (Manifest V3)
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jaluova/oj2md&type=Date)](https://star-history.com/#jaluova/oj2md&Date)

## License

[MIT](LICENSE) © 2026 jaluova

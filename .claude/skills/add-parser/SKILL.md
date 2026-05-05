---
name: add-parser
description: |
  Guide for adding a new OJ (Online Judge) platform parser to the OJ2MD Chrome extension.
  This skill teaches Claude how to analyze an OJ problem page, write a parser class,
  register it, and update manifest permissions — all following the project's plugin architecture.

  Use this skill when the user:
  - Asks to add support for a specific OJ platform
  - Says "help me add XYZ OJ" or "I want to support <domain>"
  - Provides a URL or saved HTML of an OJ problem page
  - Wants to extend OJ2MD to new platforms

  The skill works with ANY OJ page — the user just needs to provide the URL or HTML.
when_to_use: add OJ | new platform | support <oj> | parser for | 接入 | 支持
---

# OJ2MD Parser Builder

Use this skill to add a new OJ (Online Judge) parser to the OJ2MD Chrome extension. The project has a plugin architecture — you only need to write one parser class and update two config files.

## Overview

```
用户提供 OJ 页面 (URL 或 HTML)
        │
        ▼
  分析页面 DOM 结构
  (标题/限制/描述/输入/输出/样例/数学公式)
        │
        ▼
  创建 parsers/xxx-parser.js
  实现 detect() + parse() + ojName
        │
        ▼
  注册到 content/parser-registry.js
  更新 manifest.json (域名+权限)
        │
        ▼
  用户重载扩展 → 测试 → 提交 PR
```

## Step 1: Get the page

Ask the user for the OJ page. Accept any of:

- **URL**: "Open https://xyzoj.com/problem/123 in browser" — use the browser tool to navigate and inspect
- **Saved HTML**: "Save the problem page as HTML and give me the path"
- **Screenshot + URL**: User shows a screenshot and provides the URL

If using browser: navigate to the page, use `read_page` to get the accessibility tree, and `get_page_text` + `javascript_exec` to extract the raw HTML structure.

If using saved HTML: use `Read` with grep to find key structural elements.

## Step 2: Analyze the DOM structure

You need to identify how this OJ renders:

### Required fields for ProblemModel

| Field | Type | What to find |
|-------|------|-------------|
| `title` | string | Problem title (usually `<h1>`, `.title`, or first large heading) |
| `timeLimit` | string | Time limit text (e.g. "1s", "1000ms", "2 seconds") |
| `memoryLimit` | string | Memory limit text (e.g. "256MB", "256 megabytes") |
| `totalSubmissions` | string | Optional — total submissions count |
| `acceptedSubmissions` | string | Optional — accepted submissions count |
| `sections[]` | array | The core content: description, input spec, output spec, samples, note |
| `sourceUrl` | string | `window.location.href` |
| `baseUrl` | string | Base URL for resolving relative image links |

### Section structure

Each section has `{ title, content, isCode }`:
- `title`: "Problem Description" / "Input" / "Output" / "Sample Input" / "Sample Output" / "Note"
- `content`: HTML string (isCode=false) or plain text (isCode=true)
- `isCode`: true for sample input/output (wraps in ```), false for HTML descriptions

### Math formula detection

Identify which math renderer this OJ uses:

| Renderer | How to detect | How to extract |
|----------|--------------|----------------|
| **KaTeX** | `.katex` spans with `annotation[encoding="application/x-tex"]` | Use `MarkdownRenderer._extractKatexFromDOM(clone)` |
| **MathJax** | `<script type="math/tex">` elements | Custom extraction: find all `script[type=\"math/tex\"]`, extract textContent, wrap in `$...$` or `$$...$$` |
| **Raw LaTeX** | `$...$` / `$$...$$` in text | Nothing needed — already in correct format |
| **SVG/Image math** | `<img>` with math formulas | Cannot extract LaTeX — note this limitation to user |

### Sample I/O structure

How are sample inputs/outputs structured?
- Are they in `<pre>` tags? Multiple `<pre>` blocks?
- Are they in `<div>` elements with specific classes?
- Are there special wrappers like CF's `.test-example-line` divs that need cleanup?

## Step 3: Write the parser

Create `parsers/xxx-parser.js` following this template:

```js
class XxxParser extends BaseParser {
  static get ojName() { return 'XXX OJ'; }

  static detect(url, doc) {
    // Check domain + key DOM element that identifies a problem page
    return url.includes('xxxoj.com') &&
           !!doc.querySelector('.problem-statement');  // ← adjust selector
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = 'XXX OJ';
    model.baseUrl = 'https://xxxoj.com';

    // --- Extract title ---
    const titleEl = doc.querySelector('...'); // adjust
    if (titleEl) model.title = titleEl.textContent.trim();

    // --- Extract time/memory limits ---
    const timeEl = doc.querySelector('...'); // adjust
    if (timeEl) model.timeLimit = timeEl.textContent.trim();
    const memEl = doc.querySelector('...'); // adjust
    if (memEl) model.memoryLimit = memEl.textContent.trim();

    // --- Extract sections ---
    // Pattern A: Sections have clear container classes
    const descEl = doc.querySelector('...');
    if (descEl) {
      let content = descEl.innerHTML;
      // Optionally extract KaTeX before innerHTML:
      // const clone = descEl.cloneNode(true);
      // MarkdownRenderer._extractKatexFromDOM(clone);
      // content = clone.innerHTML;
      model.sections.push({ title: 'Problem Description', content, isCode: false });
    }

    // Pattern B: Mixed content in one container, split by headings
    // ... (use whichever pattern matches the OJ)

    // --- Extract samples ---
    const sampleInputs = doc.querySelectorAll('...');
    const sampleOutputs = doc.querySelectorAll('...');
    // Push with isCode: true

    return model;
  }
}
```

### Key patterns for parse()

**Pattern A — Clear section containers** (like CF):
```
doc.querySelector('.input-specification') → model.sections.push(...)
doc.querySelector('.output-specification') → model.sections.push(...)
```

**Pattern B — Table-based layout** (like old HDU):
```
Find all section headers → iterate → match with content divs
```

**Pattern C — Single content area with semantic headings**:
```
Get main content div → split by h2/h3 tags → create sections
```

### Math extraction patterns

**For KaTeX** (copy from HDU parser):
```js
const clone = value.cloneNode(true);
MarkdownRenderer._extractKatexFromDOM(clone);
content = clone.innerHTML;
```

**For MathJax** (copy from CF parser):
```js
// Must be called on a clone BEFORE taking innerHTML
CfParser._extractMathJax(clone);
// Then take innerHTML: content = clone.innerHTML;
```

**For both in one parser** (some OJs use both):
```js
const clone = contentEl.cloneNode(true);
// Try KaTeX first
MarkdownRenderer._extractKatexFromDOM(clone);
// Then MathJax
const scripts = clone.querySelectorAll('script[type="math/tex"]');
for (let i = scripts.length - 1; i >= 0; i--) {
  const script = scripts[i];
  const tex = script.textContent.trim();
  // Remove preceding MathJax spans
  let prev = script.previousElementSibling;
  while (prev) {
    const rm = prev;
    prev = prev.previousElementSibling;
    if (rm.classList.contains('MathJax') || rm.classList.contains('MathJax_Preview')) {
      rm.remove();
    }
  }
  script.replaceWith(document.createTextNode('$' + tex + '$'));
}
content = clone.innerHTML;
```

### Important: always clone before mutating

Never modify the original page DOM — always use `.cloneNode(true)` before calling extract methods or removing elements.

## Step 4: Register the parser

### 4a. Add to content/parser-registry.js

```js
const PARSER_REGISTRY = [
  HduParser,
  CfParser,
  XxxParser,  // ← add here
];
```

### 4b. Update manifest.json

Add the OJ's domain to TWO places:

1. **`host_permissions`** — for extension to access the domain:
```json
"host_permissions": [
  "...existing ones...",
  "https://xxxoj.com/*"
]
```

2. **`content_scripts.matches`** — for content script injection:
```json
"matches": [
  "...existing ones...",
  "https://xxxoj.com/problem/*",
  "https://xxxoj.com/contest/*"
]
```

3. **`content_scripts.js`** — add the parser file:
```json
"js": [
  "...existing ones...",
  "parsers/xxx-parser.js",
  "..."
]
```

## Step 5: Test

After all changes:
1. Tell the user: "Go to `chrome://extensions/`, click refresh on OJ2MD"
2. Open a problem page on the new OJ
3. The floating button should appear at bottom-right
4. Click it → markdown should be copied to clipboard
5. Paste somewhere to verify the output

### Common issues

| Symptom | Likely cause |
|---------|-------------|
| Button doesn't appear | `detect()` returning false — check URL pattern and DOM selector |
| HTML tags in markdown | Math extraction not applied — verify clone + extract before innerHTML |
| Missing sections | QuerySelector not matching — check the actual DOM structure |
| Math formulas as raw HTML | Wrong renderer type — check if this OJ uses KaTeX, MathJax, or raw LaTeX |
| `$...$` appears literally | MathJax delimiter leak — verify `_extractMathJax` removes all MathJax siblings |
| Extension not loading | Syntax error in parser — check browser console at chrome://extensions |

## Step 6: Commit

After verification, commit with a descriptive message:
```
Add XXX OJ parser

- New XxxParser for <domain>
- Supports <features>
- Match URLs: <patterns>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## Reference: Full file list

Before writing the parser, read these files for context:
- `core/problem-model.js` — the data model
- `core/markdown-renderer.js` — HTML→Markdown converter (handles tags, entities, KaTeX)
- `parsers/base-parser.js` — the interface
- `parsers/_template.js` — template with comments
- `parsers/cf-parser.js` — example: MathJax + structured sections
- `parsers/hdu-parser.js` — example: KaTeX + two frontend variants
- `content/parser-registry.js` — registry

## Key constraints

- **No external dependencies** — parsers run as content scripts, use only browser APIs and project classes
- **No async in detect()** — detect is synchronous, if the OJ loads content via SPA/XHR, use a MutationObserver approach or detect on URL pattern only
- **Preserve math** — extracted LaTeX must use `$...$` (inline) or `$$...$$` (display) delimiters
- **Never innerHTML on live DOM** — always clone first if you're going to modify elements
- **content.isCode** — set to true only for sample input/output (plain text, wrapped in ```); set to false for all other sections (HTML, converted to markdown)

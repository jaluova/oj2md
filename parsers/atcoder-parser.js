class AtCoderParser extends BaseParser {
  static get ojName() { return 'AtCoder'; }

  static detect(url, doc) {
    return url.includes('atcoder.jp') &&
           !!doc.querySelector('#task-statement');
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = 'AtCoder';
    model.baseUrl = 'https://atcoder.jp';

    // ── Title ────────────────────────────────────────────────
    const titleEl = doc.querySelector('title');
    if (titleEl) {
      // "A - Grandma's Footsteps" — keep the contest index prefix
      model.title = titleEl.textContent.trim();
    }

    // ── Time / Memory limits ─────────────────────────────────
    // Found in a <p> like "Time Limit: 2 sec / Memory Limit: 1024 MiB"
    // This <p> sits just before #task-statement
    const taskStmt = doc.querySelector('#task-statement');
    if (taskStmt) {
      let node = taskStmt.previousElementSibling;
      while (node) {
        if (node.tagName === 'P') {
          const text = node.textContent;
          const m = text.match(/Time\s*Limit\s*:\s*(.+?)\s*\/\s*Memory\s*Limit\s*:\s*(.+)/i);
          if (m) {
            model.timeLimit = m[1].trim();
            model.memoryLimit = m[2].trim();
            break;
          }
        }
        node = node.previousElementSibling;
      }
    }

    // ── Sections ─────────────────────────────────────────────
    // Prefer English (`.lang-en`), fall back to Japanese (`.lang-ja`)
    let langEn = doc.querySelector('.lang-en');
    if (!langEn) langEn = doc.querySelector('.lang-ja');
    const container = langEn || taskStmt;
    if (!container) return model;

    // AtCoder wraps sections in `<div class="part">` *inside* the lang span.
    // Some pages also have them as direct children of `#task-statement`.
    const parts = container.querySelectorAll('.part');
    let explanationIndex = 0;

    parts.forEach(part => {
      const h3 = part.querySelector('h3');
      const pre = part.querySelector('pre');

      // Clean section title — strip Copy buttons from its text
      let sectionTitle = '';
      if (h3) {
        sectionTitle = AtCoderParser._cleanTitle(h3);
      }

      if (pre && sectionTitle) {
        // ── Sample input / output ──────────────────────────
        model.sections.push({
          title: sectionTitle,
          content: pre.textContent,
          isCode: true
        });

        // After sample output, AtCoder often includes explanation paragraphs.
        // Extract everything after the last `<pre>` as an explanation section.
        const clone = part.cloneNode(true);
        clone.querySelector('h3')?.remove();
        clone.querySelectorAll('.btn-copy, .div-btn-copy, pre').forEach(el => el.remove());
        MarkdownRenderer._extractKatexFromDOM(clone);
        const remaining = clone.innerHTML.trim();
        if (remaining) {
          explanationIndex++;
          model.sections.push({
            title: `Explanation ${explanationIndex}`,
            content: remaining,
            isCode: false
          });
        }
      } else if (sectionTitle) {
        // ── Regular section ────────────────────────────────
        const clone = part.cloneNode(true);
        clone.querySelector('h3')?.remove();
        clone.querySelectorAll('.btn-copy, .div-btn-copy').forEach(el => el.remove());
        MarkdownRenderer._extractKatexFromDOM(clone);
        const content = clone.innerHTML.trim();
        if (content) {
          model.sections.push({
            title: sectionTitle,
            content,
            isCode: false
          });
        }
      }
    });

    return model;
  }

  // ══════════════════════════════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════════════════════════════

  /**
   * Extract clean section title from an <h3> element.
   * Removes "Copy" button text that may be appended.
   */
  static _cleanTitle(h3) {
    // Clone so we don't mutate the live DOM
    const clone = h3.cloneNode(true);
    // Remove copy buttons
    clone.querySelectorAll('.btn-copy, .btn').forEach(b => b.remove());
    return clone.textContent.trim();
  }
}

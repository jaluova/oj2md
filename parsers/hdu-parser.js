class HduParser extends BaseParser {
  static get ojName() { return 'HDU OJ'; }

  static detect(url, doc) {
    if (!url.includes('acm.hdu.edu.cn')) return false;

    // Old frontend: showproblem.php
    if (url.includes('showproblem.php') && doc.querySelector('.panel_title'))
      return true;

    // New frontend: contest/problem
    if (url.includes('contest/problem') && doc.querySelector('.problem-detail-block'))
      return true;

    return false;
  }

  static parse(url, doc) {
    if (url.includes('contest/problem')) {
      return HduParser._parseNew(url, doc);
    }
    return HduParser._parseOld(url, doc);
  }

  // ── Old frontend ────────────────────────────────────────
  static _parseOld(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = 'HDU OJ';
    model.baseUrl = 'http://acm.hdu.edu.cn';

    const h1 = doc.querySelector('h1');
    if (h1) model.title = h1.textContent.trim();

    const metaSpan = doc.querySelector('span[style*="color:green"]');
    if (metaSpan) {
      const text = metaSpan.textContent;
      model.timeLimit = (text.match(/Time Limit\s*:\s*(.+?)(?:\s{2,}|$)/) || [])[1] || '';
      model.memoryLimit = (text.match(/Memory Limit\s*:\s*(.+?)(?:\s{2,}|$)/) || [])[1] || '';
      model.totalSubmissions = (text.match(/Total Submission\(s\)\s*:\s*([\d,]+)/) || [])[1] || '';
      model.acceptedSubmissions = (text.match(/Accepted Submission\(s\)\s*:\s*([\d,]+)/) || [])[1] || '';
    }

    const titles = doc.querySelectorAll('.panel_title');
    const contents = doc.querySelectorAll('.panel_content');
    titles.forEach((titleEl, i) => {
      const sectionName = titleEl.textContent.trim();
      const contentEl = contents[i];
      if (!contentEl) return;

      const isCode = (sectionName === 'Sample Input' || sectionName === 'Sample Output');
      let content;
      if (isCode) {
        const preEl = contentEl.querySelector('pre');
        content = preEl ? preEl.textContent : contentEl.textContent;
      } else {
        content = contentEl.innerHTML;
      }

      model.sections.push({ title: sectionName, content, isCode });
    });

    return model;
  }

  // ── New frontend (contest/problem) ─────────────────────
  static _parseNew(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = 'HDU OJ';
    model.baseUrl = 'https://acm.hdu.edu.cn';

    // Title: sidebar h3 or print-title h2
    const sidebarH3 = doc.querySelector('.problem-sidebar h3');
    const printTitle = doc.querySelector('.problem-print-title');
    if (sidebarH3) {
      model.title = sidebarH3.textContent.trim();
    } else if (printTitle) {
      model.title = printTitle.textContent.trim().replace(/^\d{4}\s+/, '');
    }

    // Metadata from sidebar .info-pair
    const infoPairs = doc.querySelectorAll('.problem-sidebar .info-pair');
    infoPairs.forEach(pair => {
      const label = pair.querySelector('.info-label');
      const value = pair.querySelector('.info-value');
      if (!label || !value) return;
      const labelText = label.textContent.trim();
      const valueText = value.textContent.trim();

      if (/time/i.test(labelText))
        model.timeLimit = valueText;
      else if (/memory/i.test(labelText))
        model.memoryLimit = valueText;
      else if (/ratio|submitted/i.test(labelText)) {
        const m = valueText.match(/\((\d+)\/(\d+)\)/);
        if (m) {
          model.acceptedSubmissions = m[1];
          model.totalSubmissions = m[2];
        }
      }
    });

    // Sections from .problem-detail-block
    const blocks = doc.querySelectorAll('.problem-detail-block');
    blocks.forEach(block => {
      const label = block.querySelector('.problem-detail-label');
      const value = block.querySelector('.problem-detail-value');
      if (!label || !value) return;

      const sectionName = label.textContent.trim();
      const isCode = value.classList.contains('code-block');

      let content;
      if (isCode) {
        content = value.textContent;
      } else {
        // Extract KaTeX before taking innerHTML
        const cloned = value.cloneNode(true);
        MarkdownRenderer._extractKatexFromDOM(cloned);
        content = cloned.innerHTML;
      }

      model.sections.push({ title: sectionName, content, isCode });
    });

    return model;
  }
}

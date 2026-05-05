class NuaaParser extends BaseParser {
  static get ojName() { return 'NUAA OJ'; }

  static detect(url, doc) {
    return url.includes('oj.nuaa.edu.cn') &&
           !!doc.querySelector('#problem-content');
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = 'NUAA OJ';
    model.baseUrl = 'https://oj.nuaa.edu.cn';

    // ── Title ────────────────────────────────────────────────
    const titleEl = doc.querySelector('.panel-title span');
    if (titleEl) {
      model.title = titleEl.textContent.trim();
    } else {
      const h1 = doc.querySelector('.panel-title');
      if (h1) model.title = h1.textContent.trim();
    }

    // ── Time / Memory limits ─────────────────────────────────
    const intrDiv = doc.querySelector('.question-intr');
    if (intrDiv) {
      const text = intrDiv.textContent;
      const timeMatch = text.match(/时间限制[：:]\s*(.+)/);
      if (timeMatch) model.timeLimit = timeMatch[1].trim();
      const memMatch = text.match(/内存限制[：:]\s*(.+)/);
      if (memMatch) model.memoryLimit = memMatch[1].trim();
    }

    // ── Content sections ─────────────────────────────────────
    const problemContent = doc.querySelector('#problem-content');
    if (!problemContent) return model;

    // Section mapping for Chinese → English titles
    const sectionMap = {
      '描述': 'Problem Description',
      '输入描述': 'Input',
      '输出描述': 'Output',
      '提示': 'Note',
      'Hint': 'Note',
    };

    // Sections are direct-children: p.title followed by .md-content div
    const titlePs = problemContent.querySelectorAll(':scope > p.title');
    titlePs.forEach(titleP => {
      const titleText = titleP.textContent.trim();
      const englishTitle = sectionMap[titleText];
      if (!englishTitle) return;

      const nextEl = titleP.nextElementSibling;
      if (!nextEl || !nextEl.classList.contains('md-content')) return;

      const clone = nextEl.cloneNode(true);
      MarkdownRenderer._extractKatexFromDOM(clone);
      const content = clone.innerHTML.trim();
      if (content) {
        model.sections.push({ title: englishTitle, content, isCode: false });
      }
    });

    // ── Sample inputs / outputs ──────────────────────────────
    const sampleInputs = problemContent.querySelectorAll('.example-input');
    const sampleOutputs = problemContent.querySelectorAll('.example-output');

    sampleInputs.forEach((inputDiv, i) => {
      const pre = inputDiv.querySelector('pre');
      if (pre) {
        const suffix = sampleInputs.length > 1 ? ` ${i + 1}` : '';
        model.sections.push({
          title: `Sample Input${suffix}`,
          content: pre.textContent,
          isCode: true
        });
      }
    });

    sampleOutputs.forEach((outputDiv, i) => {
      const pre = outputDiv.querySelector('pre');
      if (pre) {
        const suffix = sampleOutputs.length > 1 ? ` ${i + 1}` : '';
        model.sections.push({
          title: `Sample Output${suffix}`,
          content: pre.textContent,
          isCode: true
        });
      }
    });

    return model;
  }
}

class CfParser extends BaseParser {
  static get ojName() { return 'Codeforces'; }

  static detect(url, doc) {
    return url.includes('codeforces.com') &&
           !!doc.querySelector('.problem-statement');
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = 'Codeforces';
    model.baseUrl = 'https://codeforces.com';

    const statement = doc.querySelector('.problem-statement');
    if (!statement) return model;

    // ── Metadata ──────────────────────────────────────────────
    const header = statement.querySelector('.header');
    if (header) {
      const titleEl = header.querySelector('.title');
      if (titleEl) {
        // Strip leading problem index like "F. " or "F. "
        model.title = titleEl.textContent.trim().replace(/^[A-Z]\d*\.\s*/, '');
      }

      const timeEl = header.querySelector('.time-limit');
      if (timeEl) {
        const label = timeEl.querySelector('.property-title');
        model.timeLimit = label
          ? timeEl.textContent.replace(label.textContent, '').trim()
          : timeEl.textContent.trim();
      }

      const memEl = header.querySelector('.memory-limit');
      if (memEl) {
        const label = memEl.querySelector('.property-title');
        model.memoryLimit = label
          ? memEl.textContent.replace(label.textContent, '').trim()
          : memEl.textContent.trim();
      }
    }

    // ── Deep-clone the statement for safe DOM mutation ─────────
    const clone = statement.cloneNode(true);
    CfParser._extractMathJax(clone);

    // ── Problem description + Input/Output specs ──────────────
    // The second child of .problem-statement is the content <div>
    const children = clone.children;
    let contentDiv = null;
    for (let i = 0; i < children.length; i++) {
      if (!children[i].classList.contains('header') &&
          !children[i].classList.contains('sample-tests') &&
          !children[i].classList.contains('note')) {
        contentDiv = children[i];
        break;
      }
    }

    if (contentDiv) {
      CfParser._extractContentSections(contentDiv, model);
    }

    // ── Sample tests ──────────────────────────────────────────
    const sampleTests = clone.querySelector('.sample-tests');
    if (sampleTests) {
      CfParser._extractSamples(sampleTests, model);
    }

    // ── Note ──────────────────────────────────────────────────
    const note = clone.querySelector('.note');
    if (note) {
      const noteClone = note.cloneNode(true);
      const noteTitle = noteClone.querySelector('.section-title');
      if (noteTitle) noteTitle.remove();
      // Remove copy buttons
      noteClone.querySelectorAll('.input-output-copier').forEach(b => b.remove());
      const noteHtml = noteClone.innerHTML.trim();
      if (noteHtml) {
        model.sections.push({ title: 'Note', content: noteHtml, isCode: false });
      }
    }

    return model;
  }

  // ══════════════════════════════════════════════════════════════
  //  MathJax → $...$ / $$...$$
  // ══════════════════════════════════════════════════════════════
  static _extractMathJax(clone) {
    const scripts = clone.querySelectorAll('script[type="math/tex"]');
    // Process in reverse — DOM mutations won't shift earlier indices
    for (let i = scripts.length - 1; i >= 0; i--) {
      const script = scripts[i];
      const tex = script.textContent.trim();

      // Detect display math (check ancestor chain)
      let isDisplay = false;
      let node = script.parentNode;
      while (node && node !== clone) {
        if (node.nodeType === Node.ELEMENT_NODE &&
            node.classList.contains('MathJax_Display')) {
          isDisplay = true;
          break;
        }
        node = node.parentNode;
      }

      // Remove preceding MathJax-rendered siblings
      let prev = script.previousElementSibling;
      while (prev) {
        const toRemove = prev;
        prev = prev.previousElementSibling;
        if (toRemove.classList.contains('MathJax') ||
            toRemove.classList.contains('MathJax_Preview')) {
          toRemove.remove();
        }
      }

      const delimiter = isDisplay ? '$$' : '$';
      script.replaceWith(document.createTextNode(delimiter + tex + delimiter));
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  Content sections
  // ══════════════════════════════════════════════════════════════
  static _extractContentSections(contentDiv, model) {
    const clone = contentDiv.cloneNode(true);

    const inputSpec = clone.querySelector('.input-specification');
    const outputSpec = clone.querySelector('.output-specification');

    // Description = everything before .input-specification
    if (inputSpec) {
      const descHtml = CfParser._htmlBefore(clone, inputSpec);
      if (descHtml.trim()) {
        model.sections.push({ title: 'Problem Description', content: descHtml, isCode: false });
      }
    }

    // Input specification
    if (inputSpec) {
      const { title, content } = CfParser._extractSectionBlock(inputSpec);
      if (content.trim()) {
        model.sections.push({ title: title || 'Input', content, isCode: false });
      }
    }

    // Output specification
    if (outputSpec) {
      const { title, content } = CfParser._extractSectionBlock(outputSpec);
      if (content.trim()) {
        model.sections.push({ title: title || 'Output', content, isCode: false });
      }
    }

    // No structured sections — treat whole thing as description
    if (!inputSpec && !outputSpec) {
      const html = clone.innerHTML.trim();
      if (html) {
        model.sections.push({ title: 'Problem Description', content: html, isCode: false });
      }
    }
  }

  static _extractSectionBlock(sectionEl) {
    const clone = sectionEl.cloneNode(true);
    const sectionTitle = clone.querySelector('.section-title');
    const title = sectionTitle ? sectionTitle.textContent.trim() : '';
    if (sectionTitle) sectionTitle.remove();
    clone.querySelectorAll('.input-output-copier').forEach(b => b.remove());
    return { title, content: clone.innerHTML };
  }

  static _htmlBefore(parent, stopEl) {
    let html = '';
    for (const child of parent.children) {
      if (child === stopEl) break;
      html += child.outerHTML;
    }
    return html;
  }

  // ══════════════════════════════════════════════════════════════
  //  Sample tests
  // ══════════════════════════════════════════════════════════════
  static _extractSamples(sampleTests, model) {
    const samples = sampleTests.querySelectorAll('.sample-test');
    samples.forEach((sample, i) => {
      const suffix = samples.length > 1 ? ` ${i + 1}` : '';

      const inputPre = sample.querySelector('.input pre');
      if (inputPre) {
        model.sections.push({
          title: `Sample Input${suffix}`,
          content: CfParser._getSampleText(inputPre),
          isCode: true
        });
      }

      const outputPre = sample.querySelector('.output pre');
      if (outputPre) {
        model.sections.push({
          title: `Sample Output${suffix}`,
          content: CfParser._getSampleText(outputPre),
          isCode: true
        });
      }
    });
  }

  static _getSampleText(pre) {
    // CF renders each line inside <div class="test-example-line">
    const lines = pre.querySelectorAll('.test-example-line');
    if (lines.length > 0) {
      return Array.from(lines).map(l => l.textContent).join('\n');
    }
    return pre.textContent;
  }
}

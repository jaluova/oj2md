class MarkdownRenderer {
  static render(model) {
    const lines = [];

    lines.push(`# ${model.title}`);
    lines.push('');

    const metaParts = [];
    if (model.timeLimit) metaParts.push(`**Time Limit:** ${model.timeLimit}`);
    if (model.memoryLimit) metaParts.push(`**Memory Limit:** ${model.memoryLimit}`);
    if (metaParts.length) {
      lines.push('> ' + metaParts.join(' | '));
    }
    const subParts = [];
    if (model.totalSubmissions) subParts.push(`Total Submission(s): ${model.totalSubmissions}`);
    if (model.acceptedSubmissions) subParts.push(`Accepted Submission(s): ${model.acceptedSubmissions}`);
    if (subParts.length) {
      lines.push('> ' + subParts.join(' | '));
    }
    if (metaParts.length || subParts.length) {
      lines.push('');
    }

    for (const section of model.sections) {
      if (!section.content || !section.content.trim()) continue;
      lines.push(`## ${section.title}`);
      lines.push('');
      if (section.isCode) {
        lines.push('```');
        lines.push(section.content.trim());
        lines.push('```');
      } else {
        lines.push(MarkdownRenderer._htmlToMarkdown(section.content, model.baseUrl));
      }
      lines.push('');
    }

    lines.push('---');
    lines.push(`*Source: [${model.ojName}](${model.sourceUrl})*`);

    return lines.join('\n');
  }

  /**
   * Walk the DOM and replace KaTeX-rendered spans with $...$ LaTeX source.
   * Called on a cloned node before taking innerHTML.
   */
  static _extractKatexFromDOM(node) {
    const katexSpans = node.querySelectorAll('.katex');
    katexSpans.forEach(span => {
      const annotation = span.querySelector('annotation[encoding="application/x-tex"]');
      if (annotation) {
        const tex = annotation.textContent.trim();
        // Check if display math (katex-display)
        const isDisplay = span.closest('.katex-display') || span.parentElement?.classList.contains('katex-display');
        const delimiter = isDisplay ? '$$' : '$';
        span.replaceWith(document.createTextNode(delimiter + tex + delimiter));
      }
    });
  }

  static _htmlToMarkdown(html, baseUrl) {
    let text = html;

    // ═══════════════════════════════════════════════════════════
    //  Block-level elements
    // ═══════════════════════════════════════════════════════════

    // <br> → newline
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // <p> → newlines
    text = text.replace(/<p\b[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');

    // <pre> → code fence
    text = text.replace(/<pre\b[^>]*>/gi, '\n```\n');
    text = text.replace(/<\/pre>/gi, '\n```\n');

    // <h1>–<h6> → #
    text = text.replace(/<\/?h[1-6]\b[^>]*>/gi, '\n## ');

    // <hr> → ---
    text = text.replace(/<hr\b[^>]*\/?>/gi, '\n---\n');

    // <ul> / <ol> → newlines around list block
    text = text.replace(/<\/?(?:ul|ol)\b[^>]*>/gi, '\n');
    // <li> → bullet
    text = text.replace(/<li\b[^>]*>/gi, '\n- ');
    text = text.replace(/<\/li>/gi, '');

    // <table> / <tr> / <td> / <th> → newlines
    text = text.replace(/<table\b[^>]*>/gi, '\n');
    text = text.replace(/<\/table>/gi, '\n');
    text = text.replace(/<tr\b[^>]*>/gi, '');
    text = text.replace(/<\/tr>/gi, '\n');
    text = text.replace(/<t[dh]\b[^>]*>/gi, '| ');
    text = text.replace(/<\/t[dh]>/gi, ' ');

    // <blockquote> → >
    text = text.replace(/<blockquote\b[^>]*>/gi, '\n> ');
    text = text.replace(/<\/blockquote>/gi, '\n');

    // ═══════════════════════════════════════════════════════════
    //  Inline elements
    // ═══════════════════════════════════════════════════════════

    // <img> → ![]()
    text = text.replace(/<img\b[^>]*src\s*=\s*["']?([^"'\s>]+)["']?[^>]*>/gi, (match, src) => {
      const fullUrl = MarkdownRenderer._resolveUrl(src, baseUrl);
      return `\n![image](${fullUrl})\n`;
    });

    // <a href> → [text](href)
    text = text.replace(/<a\b[^>]*href\s*=\s*["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/gi, (match, href, inner) => {
      const fullUrl = MarkdownRenderer._resolveUrl(href, baseUrl);
      const innerText = inner.replace(/<[^>]+>/g, '').trim();
      return `[${innerText}](${fullUrl})`;
    });

    // <code> → `code`
    text = text.replace(/<code\b[^>]*>/gi, '`');
    text = text.replace(/<\/code>/gi, '`');

    // <i>/<em> → *
    text = text.replace(/<\/?i\b[^>]*>/gi, '*');
    text = text.replace(/<\/?em\b[^>]*>/gi, '*');

    // <b>/<strong> → **
    text = text.replace(/<\/?b\b[^>]*>/gi, '**');
    text = text.replace(/<\/?strong\b[^>]*>/gi, '**');

    // <sub> / <sup>
    text = text.replace(/<sub\b[^>]*>/gi, '~');
    text = text.replace(/<\/sub>/gi, '~');
    text = text.replace(/<sup\b[^>]*>/gi, '^');
    text = text.replace(/<\/sup>/gi, '^');

    // <del> / <s> → ~~
    text = text.replace(/<\/?(?:del|s)\b[^>]*>/gi, '~~');

    // Strip layout-wrapper tags (div/span/font/center)
    text = text.replace(/<\/?(?:div|span|font|center)\b[^>]*>/gi, '');

    // Decode entities (after tag processing so we don't break HTML)
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#0*39;/gi, "'");
    text = text.replace(/&minus;/gi, '−');
    text = text.replace(/&ge;/gi, '≥');
    text = text.replace(/&le;/gi, '≤');
    text = text.replace(/&times;/gi, '×');
    text = text.replace(/&hellip;/gi, '…');
    text = text.replace(/&mdash;/gi, '—');
    text = text.replace(/&ndash;/gi, '–');
    text = text.replace(/&ne;/gi, '≠');
    text = text.replace(/&equiv;/gi, '≡');
    text = text.replace(/&sim;/gi, '∼');
    text = text.replace(/&prop;/gi, '∝');
    text = text.replace(/&infin;/gi, '∞');
    text = text.replace(/&radic;/gi, '√');
    text = text.replace(/&int;/gi, '∫');
    text = text.replace(/&sum;/gi, '∑');
    text = text.replace(/&prod;/gi, '∏');
    text = text.replace(/&perp;/gi, '⊥');
    text = text.replace(/&parallel;/gi, '∥');
    text = text.replace(/&rarr;/gi, '→');
    text = text.replace(/&larr;/gi, '←');
    text = text.replace(/&uarr;/gi, '↑');
    text = text.replace(/&darr;/gi, '↓');
    text = text.replace(/&harr;/gi, '↔');

    // Collapse whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+\n/g, '\n');
    text = text.replace(/\n[ \t]+/g, '\n');

    return text.trim();
  }

  static _resolveUrl(url, baseUrl) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('javascript:')) return '';
    if (url.startsWith('/')) {
      const m = baseUrl.match(/^(https?:\/\/[^\/]+)/);
      return (m ? m[1] : baseUrl) + url;
    }
    const m = baseUrl.match(/^(https?:\/\/[^\/]+\/)/);
    return (m ? m[1] : baseUrl + '/') + url;
  }
}

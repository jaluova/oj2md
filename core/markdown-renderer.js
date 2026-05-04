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

    // Strip wrapper tags
    text = text.replace(/<\/?(?:div|span|font|center)\b[^>]*>/gi, '');

    // <br> → newline
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // <p> → newlines
    text = text.replace(/<p\b[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');

    // <img> → ![]()
    text = text.replace(/<img\b[^>]*src\s*=\s*["']?([^"'\s>]+)["']?[^>]*>/gi, (match, src) => {
      const fullUrl = MarkdownRenderer._resolveUrl(src, baseUrl);
      return `\n![image](${fullUrl})\n`;
    });

    // <i>/<em> → *
    text = text.replace(/<\/?i\b[^>]*>/gi, '*');
    text = text.replace(/<\/?em\b[^>]*>/gi, '*');

    // <b>/<strong> → **
    text = text.replace(/<\/?b\b[^>]*>/gi, '**');
    text = text.replace(/<\/?strong\b[^>]*>/gi, '**');

    // <pre> → code fence
    text = text.replace(/<pre\b[^>]*>/gi, '\n```\n');
    text = text.replace(/<\/pre>/gi, '\n```\n');

    // <a href> → [text](href)
    text = text.replace(/<a\b[^>]*href\s*=\s*["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/gi, (match, href, inner) => {
      const fullUrl = MarkdownRenderer._resolveUrl(href, baseUrl);
      const innerText = inner.replace(/<[^>]+>/g, '').trim();
      return `[${innerText}](${fullUrl})`;
    });

    // Decode entities
    text = text.replace(/&nbsp;/gi, ' ');
    text = text.replace(/&lt;/gi, '<');
    text = text.replace(/&gt;/gi, '>');
    text = text.replace(/&amp;/gi, '&');
    text = text.replace(/&quot;/gi, '"');
    text = text.replace(/&#0*39;/gi, "'");

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

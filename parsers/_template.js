/**
 * Template for adding a new OJ parser.
 *
 * Copy this file, rename to xxx-parser.js, and:
 * 1. Implement detect(), parse(), and the ojName getter
 * 2. Register in content/parser-registry.js
 * 3. Add domain to manifest.json (host_permissions + content_scripts)
 *
 * The parse() method should fill a ProblemModel with:
 *   - title: problem title string
 *   - timeLimit / memoryLimit / totalSubmissions / acceptedSubmissions
 *   - sections[]: array of {title, content, isCode}
 *     - isCode=true means content is plain text (sample I/O), wrapped in ```
 *     - isCode=false means content is HTML, will be converted via _htmlToMarkdown()
 *   - sourceUrl: original problem URL
 *   - baseUrl: for resolving relative image/asset URLs
 *   - ojName: human-readable name
 */

class TemplateParser extends BaseParser {
  static get ojName() { return 'OJ Name Here'; }

  static detect(url, doc) {
    // Example: check domain + path
    // return url.includes('example.com') && url.includes('/problem/');
    return false;
  }

  static parse(url, doc) {
    const model = new ProblemModel();
    model.sourceUrl = url;
    model.ojName = this.ojName;
    model.baseUrl = 'https://example.com';

    // TODO: Extract title from DOM
    // const titleEl = doc.querySelector('...');
    // model.title = titleEl ? titleEl.textContent.trim() : '';

    // TODO: Extract metadata
    // model.timeLimit = ...
    // model.memoryLimit = ...

    // TODO: Extract sections
    // model.sections.push({ title: 'Problem Description', content: '...', isCode: false });
    // model.sections.push({ title: 'Sample Input', content: '...', isCode: true });

    return model;
  }
}

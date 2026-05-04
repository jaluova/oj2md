(function() {
  'use strict';

  const result = ParserRegistry.detect(window.location.href, document);
  if (!result) return;

  const { parser: Parser } = result;

  // Floating button
  const btn = document.createElement('button');
  btn.className = 'oj2md-float-btn';
  btn.title = `Copy as Markdown (${Parser.ojName})`;
  btn.textContent = 'MD';
  btn.addEventListener('click', async () => {
    try {
      const model = Parser.parse(window.location.href, document);
      const markdown = MarkdownRenderer.render(model);
      const success = await ClipboardUtil.copy(markdown);
      if (success) {
        ToastUtil.show(`已复制到剪贴板！(${Parser.ojName})`, 'success');
      } else {
        ToastUtil.show('复制失败，请通过扩展 popup 重试', 'error');
      }
    } catch (err) {
      console.error('[OJ2MD] Error:', err);
      ToastUtil.show(`错误: ${err.message}`, 'error');
    }
  });
  document.body.appendChild(btn);

  // Popup message handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'parseAndCopy') {
      try {
        const model = Parser.parse(window.location.href, document);
        const markdown = MarkdownRenderer.render(model);
        ClipboardUtil.copy(markdown).then(success => {
          sendResponse({ success, ojName: Parser.ojName });
        });
        return true;
      } catch (err) {
        sendResponse({ success: false, error: err.message });
        return false;
      }
    }

    if (message.action === 'getStatus') {
      sendResponse({
        supported: true,
        ojName: Parser.ojName,
        parserCount: ParserRegistry.count
      });
      return false;
    }
  });
})();

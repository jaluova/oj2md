(function() {
  'use strict';

  const result = ParserRegistry.detect(window.location.href, document);
  if (!result) return;

  const { parser: Parser } = result;

  // ── Copy handler ──────────────────────────────────────────────
  async function doCopy() {
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
  }

  // ── Floating button with project-icon SVG ─────────────────────
  const btn = document.createElement('button');
  btn.className = 'oj2md-float-btn';
  btn.title = `Copy as Markdown (${Parser.ojName})`;

  // Inline SVG identical to icons/icon.svg (project brand icon)
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="40" height="40">' +
      '<defs>' +
        '<linearGradient id="oj2md-bg" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#2563EB"/>' +
          '<stop offset="100%" stop-color="#1A5CC8"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="128" height="128" rx="24" fill="url(#oj2md-bg)"/>' +
      '<path d="M40 38 L20 64 L40 90" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M88 38 L108 64 L88 90" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="64" y="78" font-family="Arial,sans-serif" font-size="44" font-weight="bold" fill="white" text-anchor="middle">M</text>' +
      '<path d="M64 104 L52 94 L76 94 Z" fill="white" opacity="0.7"/>' +
      '<path d="M64 88 L64 94" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.7"/>' +
    '</svg>';

  // ── Drag logic (mouse + touch) ────────────────────────────────
  let dragging = false;
  let hasMoved = false;
  let startX, startY, startLeft, startTop;

  function onStart(clientX, clientY, e) {
    dragging = true;
    hasMoved = false;
    startX = clientX;
    startY = clientY;
    const rect = btn.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    btn.classList.add('dragging');
    e.preventDefault();
  }

  function onMove(clientX, clientY) {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
    }
    btn.style.left = (startLeft + dx) + 'px';
    btn.style.top = (startTop + dy) + 'px';
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    btn.classList.remove('dragging');
  }

  // Mouse events
  btn.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    onStart(e.clientX, e.clientY, e);
  });
  document.addEventListener('mousemove', (e) => {
    onMove(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', onEnd);

  // Touch events
  btn.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    onStart(t.clientX, t.clientY, e);
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    onMove(t.clientX, t.clientY);
  });
  document.addEventListener('touchend', onEnd);

  // Click: only fire if user didn't drag
  btn.addEventListener('click', (e) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    doCopy();
  });

  document.body.appendChild(btn);

  // ── Popup message handler ─────────────────────────────────────
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

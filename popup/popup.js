(function() {
  'use strict';

  const statusEl = document.getElementById('status');
  const copyBtn = document.getElementById('copyBtn');
  const resultEl = document.getElementById('result');
  const footerEl = document.getElementById('footer');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      statusEl.textContent = '无法获取当前标签页';
      statusEl.className = 'status status-unsupported';
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not injected — page not supported or not matched
        statusEl.textContent = '当前页面不是支持的 OJ 题目页';
        statusEl.className = 'status status-unsupported';
        footerEl.textContent = '支持的 OJ: HDU OJ / Codeforces / AtCoder';
        return;
      }

      if (response && response.supported) {
        statusEl.innerHTML = `当前: <span class="oj-name">${response.ojName}</span>`;
        statusEl.className = 'status status-supported';
        copyBtn.disabled = false;
        const names = response.parserNames || [];
        footerEl.textContent = `已注册 ${response.parserCount} 个解析器: ${names.join(' / ')}`;
      } else {
        statusEl.textContent = '当前页面不支持解析';
        statusEl.className = 'status status-unsupported';
        footerEl.textContent = '支持的 OJ: HDU OJ / Codeforces / AtCoder';
      }
    });
  });

  copyBtn.addEventListener('click', () => {
    copyBtn.disabled = true;
    copyBtn.textContent = '复制中...';
    resultEl.textContent = '';
    resultEl.className = 'result';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, { action: 'parseAndCopy' }, (response) => {
        copyBtn.disabled = false;
        copyBtn.textContent = 'Copy as Markdown';

        if (chrome.runtime.lastError) {
          resultEl.textContent = '通信失败，请刷新页面后重试';
          resultEl.className = 'result result-error';
          return;
        }

        if (response && response.success) {
          resultEl.textContent = `已复制！(${response.ojName})`;
          resultEl.className = 'result result-success';
          setTimeout(() => { resultEl.textContent = ''; }, 2000);
        } else {
          resultEl.textContent = response?.error || '复制失败';
          resultEl.className = 'result result-error';
        }
      });
    });
  });
})();

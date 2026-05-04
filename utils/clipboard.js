class ClipboardUtil {
  static async copy(text) {
    // Path 1: Clipboard API (HTTPS / localhost only)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        console.warn('[OJ2MD] Clipboard API failed, trying execCommand:', e);
      }
    }

    // Path 2: execCommand fallback (works on HTTP)
    return ClipboardUtil._execCopy(text);
  }

  static _execCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);

    const selection = document.getSelection();
    const originalRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (e) {
      console.error('[OJ2MD] execCommand copy failed:', e);
    }

    if (originalRange) {
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }

    document.body.removeChild(textarea);
    return success;
  }
}

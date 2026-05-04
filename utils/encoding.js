class EncodingUtil {
  /**
   * Decode gb2312 bytes to UTF-8 string.
   * Used when a future parser needs to fetch() raw HTML directly.
   * Not needed for content-script DOM parsing (browser handles it).
   */
  static decodeGb2312(buffer) {
    try {
      return new TextDecoder('gb2312').decode(buffer);
    } catch (e) {
      return EncodingUtil._fallbackDecode(buffer);
    }
  }

  /**
   * Minimal fallback: try gbk, then gb18030, then latin1.
   */
  static _fallbackDecode(buffer) {
    for (const enc of ['gbk', 'gb18030', 'latin1']) {
      try {
        return new TextDecoder(enc).decode(buffer);
      } catch (e) { /* try next */ }
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  }
}

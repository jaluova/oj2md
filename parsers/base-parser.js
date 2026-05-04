class BaseParser {
  /**
   * @param {string} url   - window.location.href
   * @param {Document} doc - the page DOM
   * @returns {boolean}
   */
  static detect(url, doc) {
    throw new Error('Parser must implement static detect(url, doc)');
  }

  /**
   * @param {string} url   - window.location.href
   * @param {Document} doc - the page DOM
   * @returns {ProblemModel}
   */
  static parse(url, doc) {
    throw new Error('Parser must implement static parse(url, doc)');
  }

  /**
   * @returns {string} Human-readable OJ name
   */
  static get ojName() {
    throw new Error('Parser must implement static getter ojName');
  }
}

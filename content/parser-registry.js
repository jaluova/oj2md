const PARSER_REGISTRY = [
  HduParser,
  CfParser,
  AtCoderParser,
  NuaaParser,
];

class ParserRegistry {
  static detect(url, doc) {
    for (const Parser of PARSER_REGISTRY) {
      if (Parser.detect(url, doc)) {
        return { parser: Parser };
      }
    }
    return null;
  }

  static register(ParserClass) {
    PARSER_REGISTRY.push(ParserClass);
  }

  static get count() {
    return PARSER_REGISTRY.length;
  }
}

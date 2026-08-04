// Serialises a JSON-LD payload for embedding in an inline
// <script type="application/ld+json">.
//
// JSON.stringify alone is NOT safe here, and this is the classic version of
// the mistake: it escapes nothing that matters to an HTML parser. A value
// containing the literal characters "</script>" — an article title, an
// excerpt, a body teaser — closes the script element early, and everything
// after it is parsed as markup. Article rows reach this from the CMS and
// from the Make.com webhook (app/api/update-articles/route.ts), whose
// payloads originate outside this codebase.
//
// Escaping "<" and ">" as \\u003c / \\u003e keeps the JSON semantically
// identical (JSON.parse and every JSON-LD consumer decode the escapes back)
// while making it impossible to terminate the element or open a new one.
// U+2028/U+2029 are escaped for the separate, older reason that they are
// valid inside a JSON string but are line terminators to a JavaScript
// parser, which can break any consumer that eval-parses the block.
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

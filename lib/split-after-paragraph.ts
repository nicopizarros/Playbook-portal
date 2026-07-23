// Fase 7: finds where the inline-article ad slot can go inside an
// HTML-rendered article body — after the Nth *top-level* closing </p>.
// "Top-level" matters because TipTap bodies nest <p> inside <blockquote>
// and <li> (see lib/tiptap-extensions.ts): splitting inside one of those
// would emit invalid, re-parsed-differently HTML. A paragraph only counts
// (and the split only happens) when every blockquote/ul/ol/li opened
// before it has been closed again.
//
// Returns null when there's no valid split point with real content left
// after it — an ad trailing the final paragraph is worse than no ad, so
// short articles simply don't get one.
const TRACKED = ['blockquote', 'ul', 'ol', 'li'] as const;

export function splitAfterParagraph(html: string, count: number): [string, string] | null {
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let depth = 0;
  let paragraphs = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(html))) {
    const isClosing = match[0].startsWith('</');
    const name = match[1].toLowerCase();
    if ((TRACKED as readonly string[]).includes(name)) {
      depth += isClosing ? -1 : 1;
      if (depth < 0) depth = 0; // malformed input: never let it go negative
    } else if (isClosing && name === 'p' && depth === 0) {
      paragraphs += 1;
      if (paragraphs === count) {
        const splitAt = match.index + match[0].length;
        const rest = html.slice(splitAt);
        if (!rest.trim()) return null;
        return [html.slice(0, splitAt), rest];
      }
    }
  }
  return null;
}

// ————————————————————————————————————————————————————————— Fuentes
// The foot-of-article source credit (publisher directive, 2026-08-10).
//
// An earlier version of the publish-sourced-article skill appended a
// visible "Fuentes" list to every body, rendered as ordinary prose: a bold
// "Fuentes:" paragraph followed by a bullet list of long headline links.
// That shape was removed in August 2026 because it read as a second,
// lower-quality ending glued to the article — three full headlines set at
// body size, competing with the closing take right above them.
//
// The credit itself was never the problem, the typography was. This brings
// it back as foot apparatus instead of body copy: one hairline, one small
// label, the outlet NAMES only (never their headlines), and an "origen"
// mark on the first one — the outlet that actually broke the story, which
// is the credit that matters. It sits outside .article-body on purpose,
// after the end mark, so it is credit rather than text: the reader who
// stops at the last paragraph never has to read past it, and the reader
// who wants to check the reporting finds it exactly where a citation
// belongs.
//
// Two authoring shapes are recognized, because both exist:
//
//   Fuentes: [Concacaf](https://…) · [Sky Sports](https://…)
//
// is what the skills write now — one paragraph, separators optional, the
// same `[text](url)` markdown every other convention already speaks. And
// the older list shape,
//
//   **Fuentes:**
//   - [Reuters: UEFA nations vote unanimously…](https://…)
//
// is what the pre-2026-08-04 catalog still carries in its bodyHtml. Both
// parse to the same list, so the back catalog gets the new treatment with
// zero re-editing — which is the whole reason to detect the old shape at
// all rather than leave those articles printing a bullet list.
//
// Same contract as every other convention in this codebase (see
// lib/product-hubs.ts): plain text an editor can type, detected
// server-side, and completely inert when it is absent or malformed — a
// "Fuentes:" paragraph with no links in it is left alone as text rather
// than silently disappearing.

export type ArticleSource = {
  /** Outlet name as shown: "Concacaf", "Sky Sports". */
  name: string;
  href: string;
  /** The full link text when it carried a headline; the title tooltip. */
  detail: string | null;
};

export type SourcesExtraction = { sources: ArticleSource[]; before: string; after: string };

// The label paragraph, plus the optional <ul> that follows it in the old
// shape. Anchors are collected from both halves, so the inline form (links
// inside the paragraph) and the list form (links inside the <li>s) both
// land in the same place.
const SOURCES_HTML_RE =
  /<p[^>]*>\s*(?:<strong>)?\s*Fuentes:?\s*(?:<\/strong>)?:?\s*([\s\S]*?)<\/p>(\s*<ul[^>]*>[\s\S]*?<\/ul>)?/i;

export const SOURCES_TEXT_PREFIX = /^\s*(?:\*\*)?\s*Fuentes:?\s*(?:\*\*)?:?\s*/i;

const ANCHOR_RE = /<a[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
const MD_LINK_RE = /\[([^\]]+)\]\((\S+?)\)/g;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

// TipTap's generateHTML escapes the body text, so a link label that came
// out of markdown arrives here as "Infantino&apos;s plan" rather than the
// characters the editor typed. Those entities are decoded back for
// rendering as React text (the component renders these as children, never
// as HTML), which is the same round trip lib/article-devices.ts does.
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)))
    .replace(/&apos;|&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// The old shape's link text is a full headline ("Reuters: UEFA nations
// vote unanimously to boycott…"). At foot size only the outlet reads, so
// the part before the first colon becomes the name when it is short enough
// to be one, and the headline survives as the link's title. A link with no
// colon (the shape the skills write today) is already just a name.
function splitName(text: string, href: string): { name: string; detail: string | null } {
  const clean = decodeEntities(stripTags(text)).replace(/\s+/g, ' ').trim();
  const colon = clean.indexOf(':');
  if (colon > 0 && colon <= 32) {
    const name = clean.slice(0, colon).trim();
    if (name) return { name, detail: clean };
  }
  if (clean) return { name: clean, detail: null };
  // Nothing usable as a label: fall back to the host, so a bare URL still
  // credits somebody rather than rendering an empty link.
  try {
    return { name: new URL(href).hostname.replace(/^www\./, ''), detail: null };
  } catch {
    return { name: href, detail: null };
  }
}

function collectAnchors(html: string): ArticleSource[] {
  const sources: ArticleSource[] = [];
  const seen = new Set<string>();
  ANCHOR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANCHOR_RE.exec(html))) {
    const href = decodeEntities(match[1]).trim();
    // Internal backlinks to other Playbook articles are cross-references,
    // not sources; they belong in the prose where they already sit.
    if (!/^https?:\/\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    sources.push({ href, ...splitName(match[2], href) });
  }
  return sources;
}

/**
 * Lifts the Fuentes paragraph (and its list, in the old shape) out of an
 * HTML body so the page can render it as foot apparatus. Returns null when
 * there is no such paragraph, or when it holds no external links — in
 * which case the body is left exactly as it was.
 */
export function extractSourcesFromHtml(html: string): SourcesExtraction | null {
  const match = html.match(SOURCES_HTML_RE);
  if (!match || match.index === undefined) return null;
  const sources = collectAnchors(`${match[1]}${match[2] || ''}`);
  if (!sources.length) return null;
  return {
    sources,
    before: html.slice(0, match.index),
    after: html.slice(match.index + match[0].length),
  };
}

/**
 * Same, for plain-text bodies (migrated/legacy articles): finds the
 * "Fuentes: …" paragraph and reads its `[text](url)` markdown links.
 * `index` is the paragraph's position, so the caller can drop it from the
 * flow the way it drops the money-trail paragraph.
 */
export function extractSourcesFromParagraphs(
  paragraphs: string[],
): { sources: ArticleSource[]; index: number } | null {
  const index = paragraphs.findIndex(p => SOURCES_TEXT_PREFIX.test(p));
  if (index === -1) return null;
  const raw = paragraphs[index].replace(SOURCES_TEXT_PREFIX, '');
  const sources: ArticleSource[] = [];
  const seen = new Set<string>();
  MD_LINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MD_LINK_RE.exec(raw))) {
    const href = match[2].trim();
    if (!/^https?:\/\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    sources.push({ href, ...splitName(match[1], href) });
  }
  return sources.length ? { sources, index } : null;
}

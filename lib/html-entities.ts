// The one escape/decode pair for device and email markup. Three files
// carried their own identical esc()/escapeHtml() copy, and only
// article-devices.ts had the matching decode — which is how the
// double-escaped apostrophe bug (&amp;apos; visible to readers, HANDOFF
// 2026-08-06) got fixed on the Cronología path but stayed alive on the
// Mapa path, while Cifra/Jugada shipped captured entities raw into
// attributes instead. The contract every consumer must follow: text
// captured out of already-serialized body HTML is DECODED first
// (generateHTML escaped it on the way in), then escaped exactly once at
// the point it's interpolated into new markup.

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, ent: string) => {
    if (ent[0] === '#') {
      const codePoint = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    const named = NAMED_ENTITIES[ent.toLowerCase()];
    return named ?? match;
  });
}

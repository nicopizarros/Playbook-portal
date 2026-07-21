// Ported from legacy/js/templates.js's safeUrl(). React already escapes
// text content and attribute values, so this isn't about injection via
// special characters — it's about URL *scheme*: a `javascript:` value has
// no special characters to escape. Editors are trusted, but this collapses
// anything but http(s)/mailto/tel/relative/hash URLs to a harmless '#' so a
// compromised or mistaken CMS entry can't become a click-to-execute link.
export function safeUrl(url: string | null | undefined): string {
  const value = String(url ?? '').trim();
  if (value === '') return '';
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith('#') || value.startsWith('/')) return value;
  return '#';
}

import { safeUrl } from './safe-url';

// Where a newsletter form actually posts its email.
//
// The forms submit with method GET and target="_blank", so the address the
// reader typed arrives at the destination as `?email=…`. Substack only
// pre-fills its subscribe box from that parameter on `/subscribe` — on the
// publication root it is ignored. Verified against the real publication,
// not assumed:
//
//   GET playbookmedia.substack.com/?email=test@example.com
//     -> subscribe box rendered EMPTY
//   GET playbookmedia.substack.com/subscribe?email=test@example.com
//     -> `value="test@example.com"` present in the markup
//
// Both `content.json`'s midCta.formUrl and the sidebar module pointed at
// the root, so the whole newsletter flow was: reader types their address,
// sees a success message, lands on Substack with an empty box, and is
// never subscribed. Normalising here rather than at each call site (or by
// asking editors to type the right path into the CMS) means every current
// and future form gets it right, whatever is stored in site_content.
//
// Deliberately conservative: only a bare Substack origin is rewritten. A
// non-Substack action, or a Substack URL with a path an editor chose on
// purpose, is passed through untouched.
export function newsletterActionUrl(url: string | null | undefined): string {
  const safe = safeUrl(url);
  if (!safe || safe === '#') return safe;

  let parsed: URL;
  try {
    parsed = new URL(safe);
  } catch {
    // Relative or otherwise non-absolute — safeUrl already vetted the
    // scheme, so hand it through as-is.
    return safe;
  }

  if (!/(^|\.)substack\.com$/i.test(parsed.hostname)) return safe;
  if (parsed.pathname !== '/' && parsed.pathname !== '') return safe;

  parsed.pathname = '/subscribe';
  return parsed.toString();
}

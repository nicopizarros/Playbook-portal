// Whether reader sign-in via Google is actually usable in this
// environment. Read server-side only (the callers are Server Components),
// same convention as lib/adsense.ts — these are not NEXT_PUBLIC_* vars and
// must never be bundled into client code.
//
// auth.ts's `Google` provider picks its client id/secret up from these two
// env vars by Auth.js's own convention (see .env.local.example). If either
// is missing, Auth.js still happily builds the authorize URL — with
// `client_id=undefined` — and the reader gets bounced to an English Google
// error page ("Access blocked: Authorization Error / Error 401:
// invalid_client") with no way back to Playbook. Observed, not assumed:
// clicking the button in an environment without the vars set does exactly
// that.
//
// That failure mode is worth guarding because this project has already
// shipped three env vars to production under the wrong name
// (Playbook_secret, GA4_property_id…, and a missing EMAIL_FROM — all in
// HANDOFF.md's record), and env var names are case-sensitive. Here the cost
// of the same slip would be the primary sign-in path silently sending every
// reader off-site. The email+password path (lib/actions/reader-auth.ts)
// needs no external service at all, so the honest degradation is to offer
// only that one rather than a button that cannot work.
export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

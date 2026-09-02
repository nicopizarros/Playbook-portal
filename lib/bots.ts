// Crawlers/link-preview bots that fetch a URL without executing JS and
// without persisting cookies across requests — ported verbatim from
// legacy/api/article-page.js's BOT_USER_AGENTS. Exempting these from the
// anonymous-reader quota is what keeps search indexing and link previews
// unaffected by metering (see lib/metering.ts): a bot that can't carry a
// quota cookie across requests would otherwise get walled on every single
// fetch, breaking SEO and social-share previews entirely.
// Refreshed 2026-09-02. The list below was ported verbatim from legacy and
// had not moved since, so it was missing two whole classes of crawler:
//
//   1. Google's non-"googlebot" agents. `ua.includes('googlebot')` does
//      cover Googlebot-News/Image/Video, but NOT Google-InspectionTool —
//      the agent behind Search Console's live URL inspection. So GSC's own
//      "test live URL" was seeing the METERED wall while the real Googlebot
//      saw the full article. Anyone auditing the site through Search
//      Console would conclude the articles were broken or thin, because
//      from where they were standing they were.
//   2. AI search crawlers. OAI-SearchBot (ChatGPT search), ChatGPT-User
//      (user-initiated fetches), PerplexityBot and ClaudeBot were all being
//      walled, which makes Playbook invisible to AI answers by default.
//
// This is an allowlist gap, not a cloaking problem: the paywall itself is
// correctly declared to Google with isAccessibleForFree + hasPart on the
// NewsArticle (see app/(public)/articulo/[id]/page.tsx), which is exactly
// what flexible sampling asks for.
const BOT_USER_AGENTS = [
  // Social / link-preview unfurlers
  'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot', 'slackbot',
  'telegrambot', 'whatsapp', 'discordbot', 'redditbot', 'applebot',
  'vkshare', 'w3c_validator', 'pinterest', 'skypeuripreview',
  // Search engines. 'googlebot' also matches Googlebot-News/Image/Video;
  // the separate Google agents below do NOT contain that substring.
  'googlebot', 'google-inspectiontool', 'googleother',
  'storebot-google', 'adsbot-google', 'mediapartners-google',
  'bingbot', 'bingpreview', 'msnbot', 'duckduckbot', 'yandexbot', 'baiduspider',
  // AI *search* crawlers — the ones that can cite Playbook and send readers
  // back. Deliberately NOT the training-only crawlers: GPTBot, CCBot
  // (Common Crawl), anthropic-ai and Bytespider harvest full text for
  // pretraining corpora and return no citation and no referral. Handing them
  // the full body of every metered article is giving the paywall away for
  // nothing. If we want to block them outright that belongs in robots.txt —
  // this list answers a different question ("who gets the full body"), and
  // the honest answer for a training crawler is "the same as everyone else".
  //
  // Note Google-Extended and Applebot-Extended are robots.txt opt-out tokens,
  // not user agents that ever appear in a request, so they were meaningless
  // here and are gone.
  'oai-searchbot', 'chatgpt-user', 'perplexitybot', 'claudebot',
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = String(userAgent || '').toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

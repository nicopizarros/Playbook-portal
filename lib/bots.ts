// Crawlers/link-preview bots that fetch a URL without executing JS and
// without persisting cookies across requests — ported verbatim from
// legacy/api/article-page.js's BOT_USER_AGENTS. Exempting these from the
// anonymous-reader quota is what keeps search indexing and link previews
// unaffected by metering (see lib/metering.ts): a bot that can't carry a
// quota cookie across requests would otherwise get walled on every single
// fetch, breaking SEO and social-share previews entirely.
const BOT_USER_AGENTS = [
  'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot', 'slackbot',
  'telegrambot', 'whatsapp', 'discordbot', 'redditbot', 'applebot',
  'googlebot', 'bingbot', 'vkshare', 'w3c_validator',
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = String(userAgent || '').toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

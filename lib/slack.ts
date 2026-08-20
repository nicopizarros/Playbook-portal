// Slack notification for newly created articles.
//
// Fires from the three — and only three — places a row can appear in
// `articles`: the Make.com webhook (app/api/update-articles/route.ts), the
// admin editor's createArticle (lib/actions/admin.ts), and the publish
// skills' write-side (scripts/publish-newsletter.ts, which goes to Neon
// over its own HTTP driver and so is easy to forget is an insert at all).
// All three call it AFTER a confirmed insert, so a duplicate swallowed by
// onConflictDoNothing never announces itself and a failed insert never
// announces a story that does not exist.
//
// Nothing else writes new rows: saveArticle/archiveArticle only touch rows
// that already exist, archiveArticle is the only writer of status='draft',
// and nothing flips a row back to 'published' — so "created" and
// "published" are the same moment for this site.
//
// Same graceful-degradation posture as lib/email.ts: a missing
// SLACK_WEBHOOK_URL or a failed POST returns { sent: false, reason }
// instead of throwing. That is not politeness — by the time this runs the
// article is already committed and the cache already revalidated, so
// throwing here would report a failure for work that actually succeeded,
// and (in the webhook's case) invite Make.com to retry an insert that
// landed.

import { SITE_URL } from '@/lib/site-url';

export type SlackResult = { sent: true } | { sent: false; reason: string };

// Slack's own docs put the p99 for an incoming-webhook POST well under a
// second. This bound exists so a hung connection can't hold open a
// serverless invocation the reader/Make.com is waiting on — the article is
// already saved, the announcement is the only thing at risk.
const SLACK_TIMEOUT_MS = 4000;

const EXCERPT_LIMIT = 280;

export type NewArticleNotification = {
  id: string;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  publication?: string | null;
  imageUrl?: string | null;
  /**
   * Which path created the row. Shown in the message so the team can tell
   * an automated digest item from something an editor wrote by hand —
   * they need very different follow-up.
   */
  origin: 'admin' | 'webhook' | 'script';
  /** Display name of the editor. Only meaningful for origin: 'admin'. */
  editor?: string | null;
};

// Slack mrkdwn reserves exactly these three characters; everything else
// (including the * _ ~ ` that mark up bold/italic) is escaped by Slack
// itself when it appears inside already-escaped text. Titles routinely
// carry "&" and the occasional "<" from a scoreline, so this is not a
// theoretical case.
function escapeMrkdwn(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(value: string, limit: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1).trimEnd()}…` : clean;
}

// The payload carries article copy and a link to the site, so a mistyped
// or tampered-with env var would be an exfiltration channel, not just a
// dead notification. Pin the destination to Slack's own webhook host
// rather than POSTing wherever the variable points.
function resolveWebhookUrl(): { url: string } | { reason: string } {
  const raw = (process.env.SLACK_WEBHOOK_URL || '').trim();
  if (!raw) return { reason: 'SLACK_WEBHOOK_URL no está configurada' };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { reason: 'SLACK_WEBHOOK_URL no es una URL válida' };
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'hooks.slack.com') {
    return { reason: 'SLACK_WEBHOOK_URL debe apuntar a https://hooks.slack.com/…' };
  }
  return { url: raw };
}

export function articlePermalink(id: string): string {
  // Matches the shape every other link to an article uses
  // (lib/analytics-data.ts, the admin dashboard): /articulo?id=<id>.
  return `${SITE_URL}/articulo?id=${encodeURIComponent(id)}`;
}

type SlackBlock = Record<string, unknown>;

export function buildNewArticleMessage(article: NewArticleNotification) {
  const url = articlePermalink(article.id);
  const title = truncate(article.title || '(sin título)', 200);
  const excerpt = truncate(article.excerpt || '', EXCERPT_LIMIT);

  const ORIGIN_LABELS: Record<NewArticleNotification['origin'], string> = {
    admin: 'panel editorial',
    webhook: 'webhook Make.com',
    script: 'publicación automatizada',
  };

  const meta = [
    article.publication || null,
    article.author ? `por ${article.author}` : null,
    `${ORIGIN_LABELS[article.origin]}${article.editor ? ` · ${article.editor}` : ''}`,
  ].filter(Boolean) as string[];

  const headline: SlackBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*<${url}|${escapeMrkdwn(title)}>*${excerpt ? `\n${escapeMrkdwn(excerpt)}` : ''}`,
    },
  };

  // Slack fetches accessory images itself, so a relative path (what the
  // editor stores for an asset served from /public) would render as a
  // broken tile. Only absolute https URLs — Vercel Blob uploads and remote
  // covers — are worth attaching.
  const image = (article.imageUrl || '').trim();
  if (/^https:\/\//i.test(image)) {
    headline.accessory = {
      type: 'image',
      image_url: image,
      alt_text: truncate(article.title || 'Portada', 140),
    };
  }

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📣 Nuevo artículo en Playbook', emoji: true },
    },
    headline,
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: escapeMrkdwn(meta.join(' · ')) }],
    },
  ];

  return {
    // Fallback for notifications and any client that can't render blocks.
    text: `Nuevo artículo en Playbook: ${title} — ${url}`,
    blocks,
  };
}

export async function notifyNewArticle(article: NewArticleNotification): Promise<SlackResult> {
  const resolved = resolveWebhookUrl();
  if ('reason' in resolved) return { sent: false, reason: resolved.reason };

  try {
    const res = await fetch(resolved.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildNewArticleMessage(article)),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    if (!res.ok) {
      // Slack answers a bad payload with 400 + a one-word body
      // ("invalid_payload", "channel_not_found"); keep it, it is the only
      // diagnostic there is.
      const body = await res.text().catch(() => '');
      return { sent: false, reason: `Slack respondió ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}` };
    }
    return { sent: true };
  } catch (err) {
    const message = (err as Error)?.name === 'TimeoutError'
      ? `Slack no respondió en ${SLACK_TIMEOUT_MS} ms`
      : (err as Error).message;
    return { sent: false, reason: message };
  }
}

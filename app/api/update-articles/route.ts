// Make.com webhook: receives one new article per POST and inserts it.
// Same URL, same x-playbook-secret header check, same request/response JSON
// shape as legacy/api/update-articles.js — only the dedup mechanism changes
// (see lib/db/schema.ts's comment on articles.sourceUrl for why).

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { ARTICLES_CACHE_TAG } from '@/lib/data/articles';
import { SPORT_OPTIONS, validateTags, formatTagIssues } from '@/lib/taxonomy';
import { checkRateLimit } from '@/lib/rate-limit';

// Only counts against failed-secret attempts, never against legitimate
// Make.com traffic (a real digest can legitimately post several items in
// quick succession, see the sourceUrl dedup comment below) -- this exists
// to blunt brute-forcing PLAYBOOK_SECRET itself, not to throttle normal use.
const WEBHOOK_AUTH_FAIL_LIMIT = 10;
const WEBHOOK_AUTH_FAIL_WINDOW_SECONDS = 10 * 60;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function constantTimeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function decodeEntities(str: string) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// Legacy's version (legacy/api/update-articles.js, ported literally in
// Fase 4) stripped tags FIRST and decoded entities AFTERWARDS — which
// means the decode step reconstructs exactly the markup the strip step
// just removed. Demonstrated with the real function before changing it:
//
//   "&lt;script&gt;alert(document.cookie)&lt;/script&gt;"
//     -> "<script>alert(document.cookie)</script>"
//   "&lt;img src=x onerror=alert(1)&gt;"
//     -> "<img src=x onerror=alert(1)>"
//
// That output is stored in articles.teaser, and app/(public)/articulo's
// looksLikeHtml() branch renders teaser through dangerouslySetInnerHTML —
// so an entity-encoded payload in a webhook item became stored HTML on a
// public page. Reaching it needs a valid PLAYBOOK_SECRET, so this was
// integration-trusted rather than anonymous input, but a function whose
// only job is "make this plain text" should not be able to emit markup at
// all, whoever calls it.
//
// Decode first, then strip, and repeat until the string stops changing:
// one pass alone still lets double-encoded input ("&amp;lt;script&amp;gt;")
// through, which the same demonstration confirmed.
//
// TAG_PATTERN requires a letter (or "/") right after the "<" rather than
// matching `<[^>]*>` like legacy did. That greedier form ate everything
// between any two angle brackets, so ordinary copy — "Precio &lt; 100 y
// algo &gt; 50" — came out as "Precio 50". Only real tag shapes are
// removed now, and a bare comparison operator survives as text.
//
// Once this loop settles, nothing matching `<letter…>` remains, which is
// also exactly the pattern app/(public)/articulo's looksLikeHtml() tests
// before choosing dangerouslySetInnerHTML — so a teaser produced here can
// only ever take the escaped-text path.
const TAG_PATTERN = /<\/?[a-zA-Z][^>]*>|<!--[\s\S]*?-->/g;

function stripHtml(str: string) {
  let out = str || '';
  for (let i = 0; i < 3; i++) {
    const next = decodeEntities(out).replace(TAG_PATTERN, ' ');
    if (next === out) break;
    out = next;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 300);
}

function detectPublication(title: string) {
  // "industry shots" in a TITLE is the newsletter's historical name and
  // still worth matching; the machine key it maps to is 'noticias' since
  // the 2026-08-14 source-key migration (TODO #2).
  if (/industry shots/i.test(title)) return { publication: 'Noticias', source: 'noticias' };
  if (/lana/i.test(title)) return { publication: 'La Lana del Deporte', source: 'la-lana' };
  if (/infinitas/i.test(title)) return { publication: 'Infinitas', source: 'infinitas' };
  // 'playbook' as its own source was retired 2026-08-01 (folded into
  // Noticias, see lib/constants.ts) -- anything that doesn't match a known
  // newsletter title now defaults to Noticias instead.
  return { publication: 'Noticias', source: 'noticias' };
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(str: string) {
  return String(str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

// Same reasoning as legacy: scope/vertical can't be inferred from article
// text with enough confidence to beat a blank field an editor fills by
// hand — a wrong auto-tag is worse than an honest gap.
function inferTags(title: string, excerpt: string) {
  const haystack = normalizeText(`${title || ''} ${excerpt || ''}`);
  if (!haystack.trim()) return { scope: [] as string[], sport: [] as string[], vertical: [] as string[] };

  const sport = SPORT_OPTIONS.filter(option => {
    if (option === 'Multi-deporte / Otros') return false;
    const pattern = new RegExp(`\\b${escapeRegExp(normalizeText(option))}\\b`);
    return pattern.test(haystack);
  });

  return { scope: [] as string[], sport, vertical: [] as string[] };
}

type WebhookPayload = {
  url?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  teaser?: string;
  author?: string;
  pubDate?: string;
  publication?: string;
  source?: string;
  tags?: { scope?: string[]; sport?: string[]; vertical?: string[] };
  priority?: number;
  featured?: boolean;
  mostrar_autor?: boolean;
  reading_time?: number;
  substack_url?: string;
  imageUrl?: string;
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-playbook-secret') || '';
  const validSecret = !!process.env.PLAYBOOK_SECRET && constantTimeEqual(secret, process.env.PLAYBOOK_SECRET);
  if (!validSecret) {
    const limit = checkRateLimit(`webhook-auth-fail:${getClientIp(req)}`, WEBHOOK_AUTH_FAIL_LIMIT, WEBHOOK_AUTH_FAIL_WINDOW_SECONDS);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many failed attempts' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let article: WebhookPayload;
  try {
    article = await req.json();
  } catch {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!article || !article.url || !article.title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const pubInfo = detectPublication(article.title);
  const slug = (article.url || '').replace(/.*\/p\//, '').replace(/[^a-z0-9-]/g, '-');
  const dateObj = new Date(article.pubDate || Date.now());
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const dateFormatted = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const dateISO = dateObj.toISOString().slice(0, 10);

  // Neutral priority (3) when not supplied, same as legacy — avoids the old
  // "maxPriority + 1" bug that silently outgrew the 5-star hero signal.
  const priority = Number.isFinite(article.priority) ? (article.priority as number) : 3;

  const excerpt = stripHtml(article.excerpt || article.description || '');
  const hasUsableTags = article.tags && (
    (article.tags.scope && article.tags.scope.length) ||
    (article.tags.sport && article.tags.sport.length) ||
    (article.tags.vertical && article.tags.vertical.length)
  );
  const proposedTags = hasUsableTags ? article.tags! : inferTags(article.title, excerpt);
  // Controlled-vocabulary gate (TODO #1): canonicalize case/accent
  // variants, drop anything out of vocabulary rather than minting an
  // unreachable tag. Dropped values are reported in the response (below)
  // so the sender sees the arbitration instead of a silent change.
  const { tags: validatedTags, issues: tagIssues } = validateTags({
    scope: proposedTags.scope || [],
    sport: proposedTags.sport || [],
    vertical: proposedTags.vertical || [],
  });
  const tags = validatedTags;

  const values = {
    title: article.title,
    excerpt,
    teaser: stripHtml(article.teaser || article.excerpt || article.description || ''),
    author: article.author || 'Guillermo Mejía',
    date: dateISO,
    dateFormatted,
    publication: article.publication || pubInfo.publication,
    source: article.source || pubInfo.source,
    tagsScope: tags.scope || [],
    tagsSport: tags.sport || [],
    tagsVertical: tags.vertical || [],
    priority,
    featured: article.featured === true,
    mostrarAutor: article.mostrar_autor === true,
    readingTime: Number.isFinite(article.reading_time) ? (article.reading_time as number) : 1,
    substackUrl: article.substack_url || article.url,
    sourceUrl: article.url,
    imageUrl: article.imageUrl || '',
  };

  // sourceUrl (not substackUrl) is the real dedup identity — see
  // lib/db/schema.ts. onConflictDoNothing targets only that constraint, so
  // an id collision (handled separately below) still surfaces as a real
  // error instead of being silently swallowed as "duplicate".
  let id = slug || `article-${Date.now().toString(36)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const [inserted] = await db
        .insert(articles)
        .values({ id, ...values })
        .onConflictDoNothing({ target: articles.sourceUrl })
        .returning();

      if (!inserted) {
        return NextResponse.json({ status: 'duplicate', url: article.url });
      }
      revalidateTag(ARTICLES_CACHE_TAG);
      return NextResponse.json({
        status: 'ok',
        article: inserted.title,
        ...(tagIssues.length ? { droppedTags: formatTagIssues(tagIssues) } : {}),
      });
    } catch (err: unknown) {
      // Postgres unique_violation on the id primary key: derive a fresh id
      // and retry once, same fallback legacy used for a slug collision.
      // Same pattern as lib/actions/admin.ts's createArticle.
      if ((err as { code?: string })?.code === '23505' && attempt === 0) {
        id = `${slug}-${Date.now().toString(36)}`;
        continue;
      }
      const message = err instanceof Error ? err.message : 'Insert failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}

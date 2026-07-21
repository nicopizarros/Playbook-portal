// Make.com webhook: receives one new article per POST and inserts it.
// Same URL, same x-playbook-secret header check, same request/response JSON
// shape as legacy/api/update-articles.js — only the dedup mechanism changes
// (see lib/db/schema.ts's comment on articles.sourceUrl for why).

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { SPORT_OPTIONS } from '@/lib/taxonomy';

function constantTimeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function stripHtml(str: string) {
  return (str || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .slice(0, 300);
}

function detectPublication(title: string) {
  if (/industry shots/i.test(title)) return { publication: 'Noticias', source: 'industry-shots' };
  if (/lana/i.test(title)) return { publication: 'La Lana del Mundial', source: 'la-lana' };
  if (/infinitas/i.test(title)) return { publication: 'Infinitas', source: 'infinitas' };
  return { publication: 'Playbook', source: 'playbook' };
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
  if (!process.env.PLAYBOOK_SECRET || !constantTimeEqual(secret, process.env.PLAYBOOK_SECRET)) {
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
  const tags = hasUsableTags ? article.tags! : inferTags(article.title, excerpt);

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
      return NextResponse.json({ status: 'ok', article: inserted.title });
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

// Inserts drafted articles straight into Postgres as published rows, the
// automated counterpart to an editor manually filling out the /admin
// "Artículos" form. Shared write-side for two skills: publish-newsletter
// (.claude/skills/publish-newsletter, Playbook's own Substack) and
// publish-sourced-article (.claude/skills/publish-sourced-article,
// third-party links with human review). Never run by hand.
//
// Usage: tsx scripts/publish-newsletter.ts <path-to-json-file>
// Input: a JSON array of ArticleInput (see type below). bodyMarkdown supports
// blank-line-separated paragraphs, "## " headings, "**bold**" spans,
// "[text](url)" links, and "- " bullet-list blocks (every non-empty line in
// the block starting with "- "), exactly what the editorial voice in each
// skill produces.

import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { articles } from '../lib/db/schema';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';
import { slugify } from '../lib/slugify';
import { validateTags, formatTagIssues, REQUIRED_PROPERTY_BY_SOURCE } from '../lib/taxonomy';
import { buildIndex, rank } from './find-duplicates.mjs';

// Uses Neon's HTTP driver (plain HTTPS, one query per request) instead of
// lib/db/client.ts's node-postgres Pool: this script runs from environments
// (Claude Code sessions, CI) whose egress only permits HTTPS, not the raw
// TCP connections node-postgres needs. The deployed Next.js app keeps using
// the pg Pool client unchanged, since that runs on Vercel, where raw TCP to
// Neon works fine.
const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

type ArticleInput = {
  title: string;
  excerpt: string;
  teaser: string;
  bodyMarkdown: string;
  author?: string;
  date: string;
  dateFormatted: string;
  publication: string;
  source: string;
  tagsScope: string[];
  tagsSport: string[];
  tagsVertical: string[];
  /** Coverage tier (hubs). Optional: a draft that omits it publishes as before. */
  tagsProperty?: string[];
  priority: number;
  featured: boolean;
  mostrarAutor?: boolean;
  readingTime: number;
  substackUrl: string;
  sourceUrl: string; // unique per-item dedupe key (see schema.ts articles.sourceUrl)
  imageUrl: string;
  imageCredit?: string;
};

function parseInlineMarks(text: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  // **bold** or [link text](url), whichever comes first; no nesting between
  // the two (not needed by any editorial voice that produces this markdown).
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((\S+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ type: 'text', text: match[1], marks: [{ type: 'bold' }] });
    } else {
      nodes.push({
        type: 'text',
        text: match[2],
        marks: [{ type: 'link', attrs: { href: match[3], target: '_blank', rel: 'noopener noreferrer' } }],
      });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return nodes.length ? nodes : [{ type: 'text', text }];
}

// Minimal markdown-ish -> TipTap doc converter: blank-line-separated blocks,
// "## " headings, "**bold**" inline spans, "![alt](url)" image blocks. Enough
// for the editorial voice's prose (fact layer + Opinión de Playbook layer)
// plus in-body images carried over from the source article, without pulling
// in a full markdown parser dependency.
export function markdownToTipTap(markdown: string): Record<string, unknown> {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  const content: JSONContent[] = blocks.map(block => {
    const imageMatch = block.match(/^!\[(.*?)\]\((\S+)\)$/);
    if (imageMatch) {
      const [, alt, src] = imageMatch;
      return { type: 'image', attrs: { src, alt: alt || null, title: null } };
    }
    const headingMatch = block.match(/^##\s+(.*)$/);
    if (headingMatch) {
      return { type: 'heading', attrs: { level: 2 }, content: parseInlineMarks(headingMatch[1]) };
    }
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length && lines.every(l => l.startsWith('- '))) {
      return {
        type: 'bulletList',
        content: lines.map(l => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarks(l.slice(2).trim()) }],
        })),
      };
    }
    return { type: 'paragraph', content: parseInlineMarks(block) };
  });

  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

async function insertOne(input: ArticleInput) {
  // Controlled-vocabulary gate (TODO #1, 2026-08-14): tags must come out of
  // lib/taxonomy.ts. Case/accent/whitespace variants are canonicalized;
  // anything else hard-fails the publish so a typo can't mint an
  // unreachable tag. The error message names the nearest option.
  const { tags, issues } = validateTags({
    scope: input.tagsScope,
    sport: input.tagsSport,
    vertical: input.tagsVertical,
    // Coverage tier (hubs). Usually absent from a draft — `?? []` so a
    // skill run that never mentions it publishes exactly as before.
    property: input.tagsProperty ?? [],
  });
  if (issues.length) {
    throw new Error(
      `[publish] "${input.title}": etiquetas fuera de la taxonomía — ${formatTagIssues(issues)}. ` +
        `Usa exactamente las opciones de lib/taxonomy.ts.`,
    );
  }
  // A product's own destination tag is derived from `source`, not judged
  // (lib/taxonomy.ts REQUIRED_PROPERTY_BY_SOURCE). Deriving it here rather than
  // trusting the draft is what keeps the tag and the ranking track from
  // drifting: `source` decides the track (`lib/rank.ts`'s `trackFor`), the tag
  // decides the destination, and until 2026-08-25 the destination was read off
  // `source` too — one string carrying two unrelated decisions, so every
  // Infinitas row published before the backfill had no tag at all.
  const requiredProperty = REQUIRED_PROPERTY_BY_SOURCE[input.source ?? ''];
  const property = [...tags.property];
  if (requiredProperty && !property.includes(requiredProperty)) {
    property.push(requiredProperty);
    console.log(`[publish] "${input.title}": añadido el tag obligatorio de producto "${requiredProperty}"`);
  }

  input = {
    ...input,
    tagsScope: tags.scope,
    tagsSport: tags.sport,
    tagsVertical: tags.vertical,
    tagsProperty: property,
  };

  const bodyJson = markdownToTipTap(input.bodyMarkdown);
  const bodyHtml = generateHTML(bodyJson as JSONContent, TIPTAP_EXTENSIONS);
  const baseId = slugify(input.title) || `articulo-${Date.now().toString(36)}`;

  let id = baseId;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const [inserted] = await db
        .insert(articles)
        .values({
          id,
          title: input.title,
          excerpt: input.excerpt,
          teaser: input.teaser,
          bodyJson,
          bodyHtml,
          author: input.author || '',
          date: input.date,
          dateFormatted: input.dateFormatted,
          publication: input.publication,
          source: input.source,
          tagsScope: input.tagsScope,
          tagsSport: input.tagsSport,
          tagsVertical: input.tagsVertical,
          tagsProperty: input.tagsProperty ?? [],
          priority: input.priority,
          featured: input.featured,
          mostrarAutor: input.mostrarAutor === true,
          readingTime: input.readingTime,
          substackUrl: input.substackUrl,
          sourceUrl: input.sourceUrl,
          imageUrl: input.imageUrl,
          imageCredit: input.imageCredit || null,
          status: 'published',
        })
        .onConflictDoNothing({ target: articles.sourceUrl })
        .returning();

      if (!inserted) {
        return { status: 'duplicate' as const, title: input.title, sourceUrl: input.sourceUrl };
      }
      return { status: 'ok' as const, id: inserted.id, title: inserted.title };
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === '23505' && attempt === 0) {
        id = `${baseId}-${Date.now().toString(36)}`;
        continue;
      }
      throw err;
    }
  }
  throw new Error('insertOne: unreachable');
}

// ————————————————————————————————————————— The overlap gate
//
// `articles.sourceUrl` has a unique index, so the same LINK can never be
// published twice. It cannot see that two different links are the same STORY,
// and on 2026-07-28 that gap published the Liga Femenil BBVA relaunch twice in
// the same minute — once from the Noticias edition and once from Infinitas,
// two Substack URLs, one announcement. `find-duplicates.mjs` scores that pair
// at 58%/66% against a 45% cut, so the signal was always there; nothing ran it.
// The overlap check was Step 0 of both skills and lived only in prose, which
// means it was skipped exactly when a run was busy.
//
// So it runs here, at the write, where it cannot be skipped. Two passes,
// because the archive alone would have missed the case above: both articles
// were new in the same batch.
const OVERLAP_CUT = 0.45; // find-duplicates' LIKELY — "same story unless proven otherwise"

type IndexRow = { id: string; title: string; excerpt: string; teaser: string; date: string; source_url: string };

export async function findOverlaps(
  items: ArticleInput[],
  // Archive rows to leave out of pass 1. A re-publish of an article being
  // replaced would otherwise be blocked by the row it is replacing, and the
  // gate's own tests need to replay a historical batch as if neither row
  // existed yet — which is the only way to prove pass 2 fires on its own.
  excludeIds: string[] = [],
): Promise<Map<number, string>> {
  const blocked = new Map<number, string>();
  const queryOf = (a: ArticleInput) => `${a.title} ${a.excerpt || ''}`;
  const excluded = new Set(excludeIds);

  // Pass 1 — against everything already published.
  const published = (await db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      teaser: articles.teaser,
      date: articles.date,
      source_url: articles.sourceUrl,
    })
    .from(articles)) as IndexRow[];
  const archive = buildIndex(published.filter(r => !excluded.has(r.id)));
  for (const [i, item] of items.entries()) {
    const [top] = rank(queryOf(item), archive, { self: item.sourceUrl });
    if (top && top.s >= OVERLAP_CUT) {
      blocked.set(i, `${(top.s * 100).toFixed(0)}% vs published /articulo?id=${top.d.id} — ${top.d.title}`);
    }
  }

  // Pass 2 — against the rest of this batch. Same-run collisions are the
  // cross-product case (one story, two editions) and the archive cannot see
  // them, because neither row exists yet.
  if (items.length > 1) {
    const batch: IndexRow[] = items.map((a, i) => ({
      id: `batch#${i}`,
      title: a.title,
      excerpt: a.excerpt,
      teaser: a.teaser,
      date: a.date,
      source_url: a.sourceUrl ?? `batch#${i}`,
    }));
    const index = buildIndex(batch);
    for (const [i, item] of items.entries()) {
      const hits = rank(queryOf(item), index, { self: batch[i].source_url }).filter(
        (h: { d: IndexRow; s: number }) => h.d.id !== `batch#${i}` && h.s >= OVERLAP_CUT,
      );
      if (hits.length && !blocked.has(i)) {
        blocked.set(i, `${(hits[0].s * 100).toFixed(0)}% vs another article in this same batch — ${hits[0].d.title}`);
      }
    }
  }
  return blocked;
}

async function main() {
  const allowOverlap = process.argv.includes('--allow-overlap');
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx scripts/publish-newsletter.ts <path-to-json-file>');
    process.exitCode = 1;
    return;
  }

  const raw = await readFile(filePath, 'utf-8');
  const items = JSON.parse(raw) as ArticleInput[];
  if (!Array.isArray(items) || !items.length) {
    console.error('Input file must contain a non-empty JSON array of articles.');
    process.exitCode = 1;
    return;
  }

  const blocked = await findOverlaps(items);
  if (blocked.size && !allowOverlap) {
    for (const [i, why] of blocked) console.error(`[publish] OVERLAP  ${items[i].title}\n           ${why}`);
    console.error(
      `[publish] refusing to publish ${blocked.size} of ${items.length} article(s): each one already has a story ` +
        'in the archive or in this batch. Apply the overlap protocol (Step 0, `overlap-check.md`) — ' +
        'upgrade the existing article, fold the items together, or drop one. ' +
        'Pass --allow-overlap only when a human has looked and decided they are genuinely different stories.',
    );
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (const [i, item] of items.entries()) {
    if (blocked.has(i)) console.warn(`[publish] overlap overridden by --allow-overlap: ${item.title}`);
    const result = await insertOne(item);
    results.push(result);
    console.log(`[publish] ${result.status}: ${result.title}${result.status === 'ok' ? ` (id=${result.id})` : ''}`);
  }

  const okCount = results.filter(r => r.status === 'ok').length;
  const dupCount = results.filter(r => r.status === 'duplicate').length;
  console.log(`[publish] done: ${okCount} published, ${dupCount} duplicate/skipped, ${results.length} total`);
}

// Guarded so other scripts (e.g. scripts/backfill-article-standards.ts) can
// import markdownToTipTap without triggering this file's own CLI entrypoint.
if (require.main === module) {
  main()
    .catch(err => {
      console.error('[publish] failed:', err);
      process.exitCode = 1;
    })
    .finally(() => process.exit(process.exitCode ?? 0));
}

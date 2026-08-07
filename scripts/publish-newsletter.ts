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

// Wraps the closing "Opinión de Playbook" take in styles/article.css's
// `.opinion-box` (green branded callout, added 2026-08-08). Covers both
// shapes the editorial voice produces: a full "La Opinión de Playbook" H2
// (usually followed by a `<ul>`, sometimes `<p>`s) for La Lana pieces kept
// close to their source structure, or the inline "**Opinión de
// Playbook:**" lead-in paragraph for Industry Shots/Infinitas' fixed
// four-paragraph shape. Pure post-processing on the rendered HTML string,
// after generateHTML(): never touches bodyJson, since the box is a display
// treatment, not part of the TipTap document schema the admin editor reads.
export function wrapOpinionBox(html: string): string {
  const headingMatch = html.match(/<h2>\s*La Opini[oó]n de Playbook\s*<\/h2>/i);
  if (headingMatch && headingMatch.index !== undefined) {
    const start = headingMatch.index;
    return `${html.slice(0, start)}<div class="opinion-box">${html.slice(start)}</div>`;
  }

  const paragraphs = [...html.matchAll(/<p>(?:(?!<\/p>).)*<\/p>/gis)];
  for (const p of paragraphs) {
    if (/^<p>\s*<strong>\s*Opini[oó]n de Playbook:\s*<\/strong>/i.test(p[0]) && p.index !== undefined) {
      return `${html.slice(0, p.index)}<div class="opinion-box">${p[0]}</div>${html.slice(p.index + p[0].length)}`;
    }
  }
  return html;
}

async function insertOne(input: ArticleInput) {
  const bodyJson = markdownToTipTap(input.bodyMarkdown);
  const bodyHtml = wrapOpinionBox(generateHTML(bodyJson as JSONContent, TIPTAP_EXTENSIONS));
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

async function main() {
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

  const results = [];
  for (const item of items) {
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

// One-off publish script for the LFA hub launch (2026-09-02): inserts the
// two exclusive-hub launch pieces (the fan-profile flagship and the LFA
// Finsus x Playbook alliance announcement) as UNLISTED rows — real,
// reachable at their /articulo/<id> URL for preview/QA, but excluded from
// every listing, the LFA hub's own "Lo último", search and the sitemap, and
// carrying `robots: noindex`. See schema.ts `articles.listed` for the
// mechanism.
//
// Content lives in scripts/data/lfa-launch-articles.json, already validated
// against `scripts/check-draft-devices.ts`. This script only does the
// mechanical part: taxonomy validation, markdown -> TipTap, boleta scoring,
// insert with listed=false.
//
// Usage: POSTGRES_URL=... npx tsx scripts/publish-lfa-launch.ts
//
// To go live on unlock: flip `listed` to true on both rows, either from
// /admin (Artículos tab -> the article -> "Visibilidad" checkbox) or:
//   UPDATE articles SET listed = true
//   WHERE id IN ('quien-es-el-fan-de-la-lfa', 'lfa-finsus-y-playbook-se-alian');
// Both then join the LFA hub's "Lo último", the sitemap, search and the
// archive on the next 60s cache revalidation. Add them to nav under the
// exclusive-hubs zone separately -- that step is manual, per the brief.

import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { articles } from '../lib/db/schema';
import { scoreFromBoleta, trackFor, type Boleta } from '../lib/rank';
import { TIPTAP_EXTENSIONS } from '../lib/tiptap-extensions';
import { validateTags, formatTagIssues } from '../lib/taxonomy';
import { markdownToTipTap } from './publish-newsletter';

const db = drizzle(neon(process.env.POSTGRES_URL!), { schema: { articles } });

type LaunchArticle = {
  id: string;
  title: string;
  excerpt: string;
  teaser: string;
  author: string;
  date: string;
  dateFormatted: string;
  publication: string;
  source: string;
  tagsScope: string[];
  tagsSport: string[];
  tagsVertical: string[];
  tagsProperty: string[];
  priority: number;
  featured: boolean;
  mostrarAutor: boolean;
  readingTime: number;
  substackUrl: string;
  imageUrl: string;
  imageCredit: string;
  listed: boolean;
  boleta: Boleta;
  bodyMarkdown: string;
};

async function insertOne(input: LaunchArticle) {
  const { tags, issues } = validateTags({
    scope: input.tagsScope,
    sport: input.tagsSport,
    vertical: input.tagsVertical,
    property: input.tagsProperty,
  });
  if (issues.length) {
    throw new Error(`[lfa-launch] "${input.title}": etiquetas fuera de la taxonomía — ${formatTagIssues(issues)}`);
  }

  const expectedKind = trackFor(input.source) === 'editorial' ? 'editorial' : 'news';
  if (input.boleta.kind !== expectedKind) {
    throw new Error(
      `[lfa-launch] "${input.title}": boleta "${input.boleta.kind}" pero source="${input.source}" corre en "${expectedKind}"`,
    );
  }
  const breakdown = scoreFromBoleta(input.boleta);
  console.log(`[lfa-launch] "${input.title}": score ${breakdown.score} (${breakdown.trace.join('; ')})`);

  const bodyJson = markdownToTipTap(input.bodyMarkdown);
  const bodyHtml = generateHTML(bodyJson as JSONContent, TIPTAP_EXTENSIONS);

  const [inserted] = await db
    .insert(articles)
    .values({
      id: input.id,
      title: input.title,
      excerpt: input.excerpt,
      teaser: input.teaser,
      bodyJson,
      bodyHtml,
      author: input.author,
      date: input.date,
      dateFormatted: input.dateFormatted,
      publication: input.publication,
      source: input.source,
      tagsScope: tags.scope,
      tagsSport: tags.sport,
      tagsVertical: tags.vertical,
      tagsProperty: tags.property,
      priority: input.priority,
      score: breakdown.score,
      confirmed: input.boleta.kind === 'news' ? input.boleta.confirmed : null,
      scoreBoleta: {
        version: 1,
        scoredAt: input.date,
        kind: input.boleta.kind,
        answers: input.boleta,
        decena: breakdown.decena,
        unit: breakdown.unit,
        score: breakdown.score,
        trace: breakdown.trace,
        legacyPriority: input.priority,
      },
      featured: input.featured,
      mostrarAutor: input.mostrarAutor,
      readingTime: input.readingTime,
      substackUrl: input.substackUrl,
      imageUrl: input.imageUrl,
      imageCredit: input.imageCredit || null,
      status: 'published',
      listed: input.listed,
    })
    .onConflictDoNothing({ target: articles.id })
    .returning();

  if (!inserted) {
    console.warn(`[lfa-launch] "${input.title}": id "${input.id}" ya existe, no se insertó de nuevo.`);
    return;
  }
  console.log(`[lfa-launch] insertado: ${inserted.id} (listed=${inserted.listed})`);
}

async function main() {
  const raw = await readFile(`${__dirname}/data/lfa-launch-articles.json`, 'utf-8');
  const items = JSON.parse(raw) as LaunchArticle[];
  for (const item of items) {
    await insertOne(item);
  }
  console.log('[lfa-launch] listo. Ambas filas quedan con listed=false: reales en /articulo/<id>, fuera de todo listado, del sitemap y con noindex hasta que se cambie el flag.');
}

if (require.main === module) {
  main()
    .catch(err => {
      console.error('[lfa-launch] failed:', err);
      process.exitCode = 1;
    })
    .finally(() => process.exit(process.exitCode ?? 0));
}

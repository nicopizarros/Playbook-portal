import { NextResponse } from 'next/server';
import { getPublicArticles } from '@/lib/data/articles';

// Backs the header search box.
//
// Why this route exists (2026-09-02): SearchBox used to receive the entire
// corpus as a prop. components/layout/Header.tsx mapped every article's
// id/title/excerpt/publication/source into `searchArticles` and passed it
// down, and because Header renders inside app/(public)/layout.tsx it did
// that on EVERY page — so all ~211 excerpts were serialized into the RSC
// payload of all 243 URLs on the site.
//
// Two costs, both real. For readers: a large payload on every single
// navigation, most of which is never used because most visits never touch
// the search box. For crawlers: the same block of article summaries
// repeated verbatim across every URL, which is the textbook shape of
// templated/boilerplate duplication.
//
// Moving the filter server-side fixes both, and the matching semantics are
// carried over EXACTLY rather than reimplemented in SQL — Postgres ILIKE is
// accent-sensitive without the unaccent extension, so "futbol" would have
// stopped finding "fútbol". Keeping the JS comparison keeps that behavior
// identical while the data stays on the server.

const RESULT_LIMIT = 8;
// Bounds the work an unauthenticated caller can ask for. Nothing here is
// expensive (getAllArticles is cached and the scan is over a few hundred
// rows), but an unbounded query string has no reason to be accepted.
const MAX_QUERY_LENGTH = 100;

// Lifted verbatim from the old client-side SearchBox: lowercase + strip
// combining diacritics, applied to both sides, so "futbol" finds "fútbol"
// and "Mexico" finds "México".
function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (!raw) return NextResponse.json({ results: [] });

  const q = normalize(raw.slice(0, MAX_QUERY_LENGTH));
  const articles = await getPublicArticles();

  const results = articles
    .filter(
      a =>
        normalize(a.title).includes(q) ||
        normalize(a.excerpt).includes(q) ||
        normalize(a.publication).includes(q)
    )
    .slice(0, RESULT_LIMIT)
    // Only the three fields the dropdown actually renders. `excerpt` is
    // searched but never returned — it was the bulk of the old payload and
    // the UI never displayed it.
    .map(a => ({ id: a.id, title: a.title, publication: a.publication, source: a.source }));

  return NextResponse.json(
    { results },
    // Per-reader and cheap to recompute; caching it at the edge would only
    // add a stale-results failure mode for no benefit.
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

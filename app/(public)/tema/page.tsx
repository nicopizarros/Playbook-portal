import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesByTag } from '@/lib/data/articles';
import { TAXONOMY, type TaxonomyTier } from '@/lib/taxonomy';
import { NewsRow } from '@/components/article/NewsRow';
import { SITE_URL } from '@/lib/site-url';

type Props = { searchParams: Promise<Partial<Record<TaxonomyTier, string>>> };

// Ported from legacy/js/tema-page.js's parseTopicFromUrl(): reads exactly
// one of ?scope=/?sport=/?vertical=, validated against the closed
// taxonomy. Unlike /autor (any string is a "plausible" name), a topic page
// can and should tell a genuinely unknown tag apart from a real one with
// zero current articles.
async function resolveTopic(searchParams: Props['searchParams']) {
  const params = await searchParams;
  const tiers = Object.keys(TAXONOMY) as TaxonomyTier[];
  const present = tiers.filter(tier => params[tier] !== undefined);
  if (present.length !== 1) return null;
  const tier = present[0];
  const value = params[tier];
  if (!value || !TAXONOMY[tier].includes(value)) return null;
  return { tier, value };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const topic = await resolveTopic(searchParams);
  if (!topic) return { title: 'Tema no encontrado', robots: { index: false, follow: false } };

  const { tier, value } = topic;
  const canonicalUrl = `${SITE_URL}/tema?${tier}=${encodeURIComponent(value)}`;
  const articles = await getArticlesByTag(tier, value);

  return {
    title: value,
    description: articles.length ? `Todo lo publicado en Playbook sobre ${value}.` : undefined,
    alternates: {
      canonical: canonicalUrl,
      types: { 'application/rss+xml': `/feed.xml?${tier}=${encodeURIComponent(value)}` },
    },
    robots: { index: articles.length > 0, follow: true },
  };
}

// Human-readable label per taxonomy tier, shown as the page eyebrow so a
// reader landing on /tema knows WHICH kind of tag they're browsing —
// "Fútbol" alone doesn't say whether it's a sport or a business vertical.
const TIER_LABELS: Record<TaxonomyTier, string> = {
  scope: 'Alcance',
  sport: 'Deporte',
  vertical: 'Vertical de negocio',
};

export default async function TemaPage({ searchParams }: Props) {
  const topic = await resolveTopic(searchParams);
  const articles = topic ? await getArticlesByTag(topic.tier, topic.value) : [];

  return (
    <>
      <main className="container news-section archive-page" id="tema-main">
        <div className="section-head page-head">
          <div>
            {topic && <span className="eyebrow">{TIER_LABELS[topic.tier]}</span>}
            <h2>{topic?.value || 'Tema'}</h2>
            <p className="sub">Todo lo publicado en Playbook sobre este tema.</p>
          </div>
          <Link className="section-link" href="/">← Volver a Noticias</Link>
        </div>

        <div>
          {!topic ? (
            <div className="empty-state error-state">
              <p>No encontramos este tema.</p>
              <p><Link href="/">Volver a Playbook</Link></p>
            </div>
          ) : articles.length ? (
            <div className="news-list">
              {articles.map(a => <NewsRow key={a.id} article={a} heading="h3" />)}
            </div>
          ) : (
            <p className="empty-state">Todavía no hay artículos sobre {topic.value}.</p>
          )}
        </div>
      </main>
    </>
  );
}

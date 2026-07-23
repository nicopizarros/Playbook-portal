import type { Metadata } from 'next';
import Link from 'next/link';
import { getArchiveArticles } from '@/lib/data/articles';
import { KNOWN_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS, type TaxonomyTier } from '@/lib/taxonomy';
import { NewsRow } from '@/components/article/NewsRow';

export const metadata: Metadata = {
  title: 'Archivo',
  description:
    'Todo lo publicado en Playbook: noticias, análisis y video sobre el negocio del deporte en México y LATAM, filtrable por fuente y por tema.',
};

type Filters = { source?: string; scope?: string; sport?: string; vertical?: string };
type Props = { searchParams: Promise<Filters> };

const TAG_TIERS: { key: TaxonomyTier; label: string; options: readonly string[] }[] = [
  { key: 'scope', label: 'Alcance', options: SCOPE_OPTIONS },
  { key: 'sport', label: 'Deporte', options: SPORT_OPTIONS },
  { key: 'vertical', label: 'Vertical de negocio', options: VERTICAL_OPTIONS },
];

// Every filter is a real link — clicking one is a normal navigation (works
// with JS disabled), keeping the other active filters intact via the
// current searchParams. See Phase 2 plan: progressive enhancement over a
// client-side re-filter is deliberate here, matching the "core reading
// experience works without JS" requirement.
function filterHref(current: Filters, key: keyof Filters, value: string) {
  const next = { ...current, [key]: value === 'all' ? undefined : value };
  const params = new URLSearchParams();
  (Object.keys(next) as (keyof Filters)[]).forEach(k => {
    if (next[k]) params.set(k, next[k] as string);
  });
  const query = params.toString();
  return query ? `/archivo?${query}` : '/archivo';
}

export default async function ArchivoPage({ searchParams }: Props) {
  const filters = await searchParams;
  const articles = await getArchiveArticles(filters);

  return (
    <>
      <main className="container news-section archive-page" id="archivo-main">
        <div className="section-head page-head">
          <div>
            <h2>Archivo</h2>
            <p className="sub">Todo lo publicado en Playbook que ya no está en la portada.</p>
          </div>
          <Link className="section-link" href="/">← Volver a Noticias</Link>
        </div>

        <div className="source-filter" role="group" aria-label="Filtrar por fuente">
          <Link
            className={`filter-btn${!filters.source ? ' active' : ''}`}
            aria-pressed={!filters.source}
            href={filterHref(filters, 'source', 'all')}
          >
            Todo
          </Link>
          {KNOWN_SOURCES.map(source => (
            <Link
              key={source}
              className={`filter-btn${filters.source === source ? ' active' : ''}`}
              aria-pressed={filters.source === source}
              href={filterHref(filters, 'source', source)}
            >
              {SOURCE_LABELS[source]}
            </Link>
          ))}
        </div>

        <div className="archive-tag-filters" aria-label="Filtrar por etiqueta">
          {TAG_TIERS.map(tier => (
            <div className="tag-filter-group" role="group" aria-label={`Filtrar por ${tier.label}`} key={tier.key}>
              <span className="tag-filter-label">{tier.label}</span>
              <Link
                className={`filter-btn${!filters[tier.key] ? ' active' : ''}`}
                aria-pressed={!filters[tier.key]}
                href={filterHref(filters, tier.key, 'all')}
              >
                Todo
              </Link>
              {tier.options.map(option => (
                <Link
                  key={option}
                  className={`filter-btn${filters[tier.key] === option ? ' active' : ''}`}
                  aria-pressed={filters[tier.key] === option}
                  href={filterHref(filters, tier.key, option)}
                >
                  {option}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="news-list fade-swap">
          {articles.length
            ? articles.map(a => <NewsRow key={a.id} article={a} heading="h3" withTagPills />)
            : <p className="empty-state">No hay más artículos con estos filtros.</p>}
        </div>
      </main>
    </>
  );
}

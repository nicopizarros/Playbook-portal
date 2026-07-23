import type { Metadata } from 'next';
import Link from 'next/link';
import { getArchiveArticles } from '@/lib/data/articles';
import { KNOWN_SOURCES, SOURCE_LABELS, type Source } from '@/lib/constants';
import { SCOPE_OPTIONS, SPORT_OPTIONS, VERTICAL_OPTIONS } from '@/lib/taxonomy';
import { NewsRow } from '@/components/article/NewsRow';
import { ArchiveGridCard } from '@/components/article/ArchiveGridCard';

export const metadata: Metadata = {
  title: 'Archivo',
  description:
    'Todo lo publicado en Playbook: noticias, análisis y video sobre el negocio del deporte en México y LATAM, filtrable por fuente y por tema.',
};

type Filters = { source?: string; scope?: string; sport?: string; vertical?: string; view?: string };
type FilterKey = 'source' | 'scope' | 'sport' | 'vertical';
type Props = { searchParams: Promise<Filters> };

const FILTER_TIERS: { key: FilterKey; label: string; options: readonly string[]; optionLabel?: (o: string) => string }[] = [
  { key: 'source', label: 'Sección', options: KNOWN_SOURCES, optionLabel: o => SOURCE_LABELS[o as Source] },
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
  const grid = filters.view === 'grid';
  // The whole taxonomy lives behind a closed-by-default <details> (same
  // "never greet the reader with tags" feedback as the article page's
  // ArticleTopics disclosure). It re-opens on its own while any filter is
  // active so the state driving the list is never invisible.
  const activeFilters = FILTER_TIERS.filter(tier => filters[tier.key]);

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

        <div className="archive-toolbar">
          <details className="archive-filters" open={activeFilters.length > 0}>
            <summary className="archive-filters-summary">
              <svg viewBox="0 0 14 13" width="13" height="12" aria-hidden="true">
                <path d="M1 1.5h12M3.5 6.5h7M5.5 11.5h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Filtros
              {activeFilters.length > 0 && (
                <span className="archive-filters-count">({activeFilters.length})</span>
              )}
              <svg className="archive-filters-chevron" viewBox="0 0 12 8" width="11" height="7" aria-hidden="true">
                <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="archive-filters-panel">
              {FILTER_TIERS.map(tier => (
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
                      {tier.optionLabel ? tier.optionLabel(option) : option}
                    </Link>
                  ))}
                </div>
              ))}
              {activeFilters.length > 0 && (
                <Link className="archive-filters-clear" href={grid ? '/archivo?view=grid' : '/archivo'}>
                  Limpiar filtros
                </Link>
              )}
            </div>
          </details>

          <div className="view-toggle" role="group" aria-label="Modo de vista">
            <Link
              className={`filter-btn${!grid ? ' active' : ''}`}
              aria-pressed={!grid}
              href={filterHref(filters, 'view', 'all')}
            >
              Lista
            </Link>
            <Link
              className={`filter-btn${grid ? ' active' : ''}`}
              aria-pressed={grid}
              href={filterHref(filters, 'view', 'grid')}
            >
              Cuadrícula
            </Link>
          </div>
        </div>

        {grid ? (
          <div className="archive-grid fade-swap">
            {articles.length
              ? articles.map(a => <ArchiveGridCard key={a.id} article={a} />)
              : <p className="empty-state">No hay más artículos con estos filtros.</p>}
          </div>
        ) : (
          <div className="news-list fade-swap">
            {articles.length
              ? articles.map(a => <NewsRow key={a.id} article={a} heading="h3" withTagPills />)
              : <p className="empty-state">No hay más artículos con estos filtros.</p>}
          </div>
        )}
      </main>
    </>
  );
}

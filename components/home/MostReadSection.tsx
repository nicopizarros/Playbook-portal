import { getMostReadArticles } from '@/lib/most-read';

// "Más leídas" — the homepage top 5. Historically GA4-only (and therefore
// invisible until credentials existed); as of 2026-08-06 it feeds itself
// from the site's own metering log when GA4 isn't configured, so it works
// from day one — see lib/most-read.ts for the source order. It renders
// nothing only when NEITHER source has any reads yet.
//
// Upgraded from the plain v24 rank-list in the same pass: the leader wears
// the green chip (the site's "the number" treatment), every row carries
// its source dot, a heat bar scaled to the leader's count, and the real
// read count. The heat bars draw themselves when the row reveals — pure
// CSS riding ScrollReveal's .is-visible class, no extra JS — and stay
// full under prefers-reduced-motion (styles/portada.css).
export async function MostReadSection() {
  const items = await getMostReadArticles();
  if (!items || !items.length) return null;
  const max = Math.max(...items.map(item => item.count));

  return (
    <section className="side-module" id="mas-leidas" aria-labelledby="mas-leidas-title">
      <h2 className="side-title" id="mas-leidas-title">Más leídas</h2>
      <p className="mr-sub">Últimos 7 días</p>
      <ol className="mr-list">
        {items.map(({ article, count }, i) => (
          <li key={article.id} className={`mr-item reveal${i === 0 ? ' mr-top' : ''}`}>
            <a className="mr-link" href={`/articulo?id=${encodeURIComponent(article.id)}`}>
              <span className="mr-rank" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="mr-body">
                <h3 className="mr-title">{article.title}</h3>
                <span className="mr-meta">
                  <span className="mr-dot" data-source={article.source} aria-hidden="true" />
                  <span className="mr-heat" aria-hidden="true">
                    <span className="mr-heat-fill" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                  </span>
                  <span className="mr-count">
                    {count} {count === 1 ? 'lectura' : 'lecturas'}
                  </span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { getMostReadArticles } from '@/lib/most-read';
import { articlePath } from '@/lib/article-url';

// "Más leídas" — the homepage top 5, fed by GA4 when configured and by
// the site's own metering log otherwise (see lib/most-read.ts). Renders
// nothing only when neither source has any reads.
//
// Layout (2026-08-06, second pass on user feedback from an iPad): a
// full-width five-column band directly under the news package, NOT a rail
// module — in the rail it stretched the sidebar far past the 1+5 columns
// and left a page-tall hole of dead space. The rail keeps newsletter +
// La cifra + ad, which roughly matches the news columns' height.
//
// Read counts are deliberately NOT rendered (user directive: "don't open
// our numbers like that") — the heat bars are RELATIVE to the leader, so
// the ranking reads as intensity without publishing internal traffic.
// The bars draw when ScrollReveal marks each item .is-visible (pure CSS,
// full and static under prefers-reduced-motion — styles/portada.css).
export async function MostReadSection() {
  const items = await getMostReadArticles();
  if (!items || !items.length) return null;
  const max = Math.max(...items.map(item => item.count));

  return (
    <section className="mr-band" id="mas-leidas" aria-labelledby="mas-leidas-title">
      <div className="mr-head">
        <h2 id="mas-leidas-title">Más leídas</h2>
        <span className="mr-sub">Últimos 7 días</span>
      </div>
      <ol className="mr-list">
        {items.map(({ article, count }, i) => (
          <li key={article.id} className={`mr-item reveal${i === 0 ? ' mr-top' : ''}`}>
            <a className="mr-link" href={articlePath(article.id)}>
              <span className="mr-rank" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="mr-body">
                <h3 className="mr-title">{article.title}</h3>
                <span className="mr-meta">
                  <span className="mr-dot" data-source={article.source} aria-hidden="true" />
                  <span className="mr-heat" aria-hidden="true">
                    <span className="mr-heat-fill" style={{ width: `${Math.round((count / max) * 100)}%` }} />
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

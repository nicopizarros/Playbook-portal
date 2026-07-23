import { getMostReadArticles } from '@/lib/most-read';

// Legacy's "Más leídas" module (legacy/index.html + legacy/js/most-read.js)
// is the one homepage section with zero editable fields — not even the
// heading comes from content.json, confirmed by grepping legacy's
// content.json and the current SiteContentData type for any trace of it
// (there is none). It's 100% resolved live from GA4 pageview ids, so this
// renders nothing at all (matching legacy's section.hidden toggle) rather
// than showing an empty shell when GA4 isn't configured or has no data yet.
//
// Fase 7 UX: moved from a full-width section into the homepage sidebar
// (components/home/NewsGrid.tsx's two-column layout), restyled to the v24
// prototype's rank-list pattern — CSS counter numerals in Anton
// (decimal-leading-zero), reading time on the right, 2px ink border-top
// header. Markup is a plain <ol>; the numbering is pure CSS (see
// styles/hero.css).
export async function MostReadSection() {
  const articles = await getMostReadArticles();
  if (!articles || !articles.length) return null;

  return (
    <section className="side-module" id="mas-leidas" aria-labelledby="mas-leidas-title">
      <h2 className="side-title" id="mas-leidas-title">Más leídas</h2>
      <ol className="rank-list">
        {articles.map(a => (
          <li key={a.id} className="rank-item">
            <a href={`/articulo?id=${encodeURIComponent(a.id)}`}>
              <h3>{a.title}</h3>
            </a>
            <span>{a.readingTime || 1} min</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

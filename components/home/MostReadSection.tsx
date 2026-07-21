import { getMostReadArticles } from '@/lib/most-read';
import { NewsRow } from '@/components/article/NewsRow';

// Legacy's "Más leídas" module (legacy/index.html + legacy/js/most-read.js)
// is the one homepage section with zero editable fields — not even the
// heading comes from content.json, confirmed by grepping legacy's
// content.json and the current SiteContentData type for any trace of it
// (there is none). It's 100% resolved live from GA4 pageview ids, so this
// renders nothing at all (matching legacy's section.hidden toggle) rather
// than showing an empty shell when GA4 isn't configured or has no data yet.
export async function MostReadSection() {
  const articles = await getMostReadArticles();
  if (!articles || !articles.length) return null;

  return (
    <section className="container" id="mas-leidas">
      <div className="section-head reveal" style={{ paddingTop: 0 }}>
        <div>
          <h2>Más leídas</h2>
        </div>
      </div>
      <div className="news-list">
        {articles.map(a => (
          <NewsRow key={a.id} article={a} heading="h3" />
        ))}
      </div>
    </section>
  );
}

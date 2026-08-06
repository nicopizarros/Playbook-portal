import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { productHubsContent } from '@/lib/product-hubs-content';
import { chronologicalNumber } from '@/lib/product-hubs';
import { SITE_URL } from '@/lib/site-url';

// The Futbol Business Review — "La Sala de Juntas". Black, not navy: a
// market briefing a business reader consults, not a magazine they browse.
// The red arrow from the card art is a functional trend indicator used
// throughout, and the Interticket co-brand is a persistent partner strip
// (the partnership is core to the product's credibility), not a footer logo.
//
// Format (reworked 2026-08-06 on user feedback that a flat list of rows read
// as plain next to /la-lana's dossier): the hub is now a printed market
// report. One edition opens it as the COVER REPORT — chosen in the CMS via
// tfbr.headlinerId rather than the site-wide `featured` flag, so headlining
// the Interticket space never bumps the homepage's top story — and the rest
// are numbered minutes of the session, each a tabbed dossier card carrying
// its issue number the way La Lana's folders carry their expediente.

export const metadata: Metadata = {
  title: 'The Futbol Business Review — La Sala de Juntas',
  description:
    'El fútbol en el mercado hispano de US, leído como negocio. The insights behind the game — engineered by Interticket, powered by Playbook.',
  alternates: { canonical: `${SITE_URL}/futbol-business-review` },
};

function TrendArrow({ direction = 'up' }: { direction?: 'up' | 'right' }) {
  return (
    <svg
      className={`tfbr-arrow tfbr-arrow-${direction}`}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 12h13M11 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export default async function FutbolBusinessReviewHubPage() {
  const [articles, content] = await Promise.all([
    getArticlesBySource('futbol-business-review'),
    getSiteContent(),
  ]);
  const stats = content.statsSection.stats;
  // Masthead copy, the Substack destination and the cover edition are all
  // CMS-editable (Hubs tab). The Substack URL lives here rather than being
  // read from the TFBR product card: that card now points AT this hub, so
  // reading it back would be circular.
  const hub = productHubsContent(content.productHubs).tfbr;

  // Cover report: the CMS-named edition when it still resolves, else the
  // most recent one, so the hub never opens headless after an id goes stale.
  const headliner =
    articles.find(a => a.id === hub.headlinerId) ?? articles[0] ?? null;
  const rest = articles.filter(a => a.id !== headliner?.id);

  return (
    <main className="hub hub-tfbr" id="futbol-business-review">
      {/* Persistent partner strip: sticks to the top of the hub while the
          reader scrolls it — the co-brand travels with the page. */}
      <div className="tfbr-partner-strip">
        <span className="tfbr-partner-brand">The Futbol Business Review</span>
        <span className="tfbr-partner-note">Engineered by Interticket × Powered by Playbook</span>
      </div>

      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-tfbr-masthead">
          <h1 className="hub-tfbr-title">
            The<br />Futbol<br />Business<br />Review
          </h1>
          <div className="hub-tfbr-lede">
            <TrendArrow />
            <p className="hub-tfbr-tagline">
              <em>{hub.taglineEm}</em> {hub.taglineRest}
            </p>
            <p className="hub-tfbr-sub">{hub.sub}</p>
          </div>
        </header>

        {headliner && (
          <section className="tfbr-cover reveal" aria-label="Reporte de portada">
            <div className="tfbr-cover-tab">
              <span className="tfbr-cover-kicker">Reporte de portada</span>
              <span className="tfbr-cover-issue">
                No. {chronologicalNumber(headliner, articles, 2)} · {headliner.dateFormatted}
              </span>
            </div>
            <div className="tfbr-cover-body">
              <div className="tfbr-cover-copy">
                <h2 className="tfbr-cover-title">
                  <Link href={`/articulo?id=${encodeURIComponent(headliner.id)}`}>
                    {headliner.title}
                  </Link>
                </h2>
                <p className="tfbr-cover-excerpt">{headliner.excerpt}</p>
                <p className="tfbr-cover-meta">
                  {headliner.author ? `${headliner.author} · ` : ''}
                  Lectura {headliner.readingTime || 1} min
                </p>
                <Link
                  className="btn tfbr-cover-btn"
                  href={`/articulo?id=${encodeURIComponent(headliner.id)}`}
                >
                  Abrir el reporte <TrendArrow direction="right" />
                </Link>
              </div>
              {headliner.imageUrl && (
                <figure className="tfbr-cover-photo">
                  {/* Editor-supplied URL, arbitrary host — see
                      components/sections/AboutSection.tsx's comment. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={headliner.imageUrl}
                    alt={headliner.title}
                    width={900}
                    height={560}
                    decoding="async"
                  />
                  <figcaption>Anexo · Interticket</figcaption>
                </figure>
              )}
            </div>
          </section>
        )}

        {/* Data-forward briefing band. These are the site's own CMS-edited
            numbers (statsSection, "Playbook en números") — real, already
            maintained figures — not invented market indicators. */}
        {stats.length > 0 && (
          <section className="tfbr-board" aria-label="Playbook en números">
            <h2 className="tfbr-board-head">El alcance, en números</h2>
            <div className="tfbr-board-grid">
              {stats.map(stat => (
                <div className="tfbr-board-item" key={stat.label}>
                  <span className="tfbr-board-value">
                    <TrendArrow direction="up" />
                    {stat.value}
                  </span>
                  <span className="tfbr-board-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section className="tfbr-minuta" aria-label="Ediciones">
            <div className="tfbr-minuta-head">
              <h2 className="tfbr-board-head">Minuta de la sala</h2>
              <span className="tfbr-minuta-count">{rest.length} ediciones</span>
            </div>
            <div className="tfbr-minuta-grid">
              {rest.map(article => (
                <Link
                  className="tfbr-memo reveal"
                  href={`/articulo?id=${encodeURIComponent(article.id)}`}
                  key={article.id}
                >
                  <span className="tfbr-memo-tab">
                    <span className="tfbr-memo-no">No. {chronologicalNumber(article, articles, 2)}</span>
                    <span className="tfbr-memo-date">{article.dateFormatted}</span>
                  </span>
                  <span className="tfbr-memo-body">
                    <h3>{article.title}</h3>
                    <span className="tfbr-memo-foot">
                      <span className="tfbr-memo-read">{article.readingTime || 1} min</span>
                      <span className="tfbr-memo-open" aria-hidden="true">
                        Abrir <TrendArrow direction="right" />
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <section className="tfbr-briefing" aria-label="Dónde leer las ediciones">
            <h2 className="tfbr-briefing-head">Minuta de la sala</h2>
            <p>
              Las ediciones de The Futbol Business Review se publican hoy en Substack.
              Cuando se editen dentro del portal, aparecerán en esta misma sala.
            </p>
            <a
              className="btn tfbr-cta"
              href={hub.substackUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Leer las ediciones →
            </a>
          </section>
        )}

        {articles.length > 0 && (
          <div className="hub-foot">
            <Link className="section-link hub-foot-link" href="/archivo?source=futbol-business-review">
              Ver The Futbol Business Review en el archivo general →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

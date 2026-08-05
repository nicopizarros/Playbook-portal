import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { caseNumber, caseStatus, extractPullFigure } from '@/lib/product-hubs';
import { MoneyTrail } from '@/components/products/MoneyTrail';
import { SITE_URL } from '@/lib/site-url';

// La Lana del Deporte — "El Expediente" (design brief 2026-08-05, format
// reworked same day on user feedback: the case-file idea and its devices
// stay — numbering, stamps, the scroll-drawn money trail — but the dark
// grunge/orange skin is gone. This is Playbook's flagship product, so it
// wears the house palette: paper, ink, the brand green, and the la-lana
// gold the rest of the site already uses for this source. The format is
// now a literal dossier: manila folder cards with tabs, on a fixed light
// paper surface that does not invert with the theme — a folder is paper
// whatever the reader's theme says.)

export const metadata: Metadata = {
  title: 'La Lana del Deporte — El Expediente',
  description:
    'Las investigaciones de La Lana del Deporte: el dinero, el poder y las decisiones que mueven al deporte fuera de la cancha, un expediente a la vez.',
  alternates: { canonical: `${SITE_URL}/la-lana` },
};

// Masthead route: the money-moves motif (México y LATAM hacia los centros
// de dinero del deporte) — decorative in the same way the card art's
// departures board is; real per-story routes render inside articles via
// the "Ruta del dinero:" convention.
const MASTHEAD_ROUTE = ['CDMX', 'MIAMI', 'MADRID', 'RIYADH'];

function Stamp({ status }: { status: 'abierto' | 'archivado' }) {
  return (
    <span className={`lana-stamp lana-stamp-${status}`}>
      {status === 'abierto' ? 'Caso abierto' : 'Archivado'}
    </span>
  );
}

export default async function LaLanaHubPage() {
  const articles = await getArticlesBySource('la-lana');
  const now = new Date();
  const [lead, ...rest] = articles;

  return (
    <main className="hub hub-lana" id="la-lana">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-lana-masthead">
          <p className="hub-lana-eyebrow">Una investigación de Playbook</p>
          <h1 className="hub-lana-title">
            La Lana <span className="hub-lana-title-accent">del Deporte</span>
          </h1>
          <p className="hub-lana-sub">
            El dinero, el poder y las decisiones que mueven al deporte fuera de la cancha.
            Un expediente a la vez.
          </p>
          <MoneyTrail stops={MASTHEAD_ROUTE} />
        </header>

        {lead ? (
          <section className="lana-folder lana-folder-lead reveal" aria-label="Último expediente">
            <div className="lana-folder-tab">
              <span className="lana-case-number">Expediente {caseNumber(lead, articles)}</span>
              <span className="lana-case-date">{lead.dateFormatted}</span>
            </div>
            <div className="lana-folder-body">
              <div className="lana-folder-copy">
                <Stamp status={caseStatus(lead, now)} />
                {/* The story's single biggest number, pulled out large as
                    the visual hook instead of buried in body text. No
                    fallback: the folder tab already carries the case
                    number, so a figure-less story just leads with its
                    title instead of saying "003" twice. */}
                {(() => {
                  const figure = extractPullFigure(lead.title, lead.excerpt, lead.teaser);
                  return figure ? <p className="lana-pull-figure">{figure}</p> : null;
                })()}
                <h2>
                  <Link href={`/articulo?id=${encodeURIComponent(lead.id)}`}>{lead.title}</Link>
                </h2>
                <p className="lana-case-excerpt">{lead.excerpt}</p>
                <div className="lana-case-fileline">
                  <span>Lectura: {lead.readingTime || 1} min</span>
                </div>
                <Link className="btn lana-open-btn" href={`/articulo?id=${encodeURIComponent(lead.id)}`}>
                  Abrir el expediente
                </Link>
              </div>
              {lead.imageUrl && (
                <figure className="lana-folder-photo">
                  {/* Editor-supplied URL, arbitrary host — see
                      components/sections/AboutSection.tsx's comment. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.imageUrl} alt={lead.title} width={900} height={560} decoding="async" />
                  <figcaption>Anexo fotográfico · Exp. {caseNumber(lead, articles)}</figcaption>
                </figure>
              )}
            </div>
          </section>
        ) : (
          <p className="empty-state hub-empty">Todavía no hay expedientes publicados.</p>
        )}

        {rest.length > 0 && (
          <section className="lana-archive" aria-label="Expedientes anteriores">
            <h2 className="lana-archive-head">Archivero</h2>
            <div className="lana-archive-grid">
              {rest.map(article => (
                <Link
                  className="lana-folder lana-folder-card reveal"
                  href={`/articulo?id=${encodeURIComponent(article.id)}`}
                  key={article.id}
                >
                  <span className="lana-folder-tab">
                    <span className="lana-case-number">Exp. {caseNumber(article, articles)}</span>
                    <span className="lana-case-date">{article.dateFormatted}</span>
                  </span>
                  <span className="lana-folder-body">
                    <h3>{article.title}</h3>
                    <span className="lana-folder-card-foot">
                      <Stamp status={caseStatus(article, now)} />
                      <span className="lana-folder-open" aria-hidden="true">Abrir →</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="hub-foot">
          <Link className="section-link hub-foot-link" href="/archivo?source=la-lana">
            Ver La Lana del Deporte en el archivo general →
          </Link>
        </div>
      </div>
    </main>
  );
}

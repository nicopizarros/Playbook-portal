import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { caseNumber, caseStatus, extractPullFigure } from '@/lib/product-hubs';
import { MoneyTrail } from '@/components/products/MoneyTrail';
import { SITE_URL } from '@/lib/site-url';

// La Lana del Deporte — "El Expediente" (design brief, 2026-08-05).
// The flagship: premium, investigative, one deep story at a time. Each
// piece is presented like a case file being unsealed — investigations are
// "Expedientes" numbered by case (001, 002…), dated by case, with the
// departures-board motif from the card art as a recurring device rather
// than a one-off header image. The hub surface is fixed-dark on purpose
// (same --ink-fixed reasoning as the footer): the torn-paper/stencil
// identity IS dark, it doesn't invert with the reader's theme.

export const metadata: Metadata = {
  title: 'La Lana del Deporte — El Expediente',
  description:
    'Las investigaciones de La Lana del Deporte: el dinero, el poder y las decisiones que mueven al deporte fuera de la cancha, un expediente a la vez.',
  alternates: { canonical: `${SITE_URL}/la-lana` },
};

// Masthead route: the board motif itself (México y LATAM hacia los centros
// de dinero del deporte) — decorative in the same way the card art's
// departures board is, and marked as such; real per-story routes render
// inside articles via the "Ruta del dinero:" convention.
const MASTHEAD_ROUTE = ['CDMX', 'MIAMI', 'MADRID', 'RIYADH'];

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
          <section className="lana-case-hero" aria-label="Último expediente">
            <div className="lana-case-hero-meta">
              <span className="lana-case-number">Expediente {caseNumber(lead, articles)}</span>
              <span className={`lana-stamp lana-stamp-${caseStatus(lead, now)}`}>
                {caseStatus(lead, now) === 'abierto' ? 'Caso abierto' : 'Archivado'}
              </span>
            </div>
            <div className="lana-case-hero-body">
              <div className="lana-case-hero-copy">
                {/* The story's single biggest number, pulled out large as
                    the visual hook instead of buried in body text; falls
                    back to the case number when the copy has no figure. */}
                <p className="lana-pull-figure">
                  {extractPullFigure(lead.title, lead.excerpt, lead.teaser) ?? `Nº ${caseNumber(lead, articles)}`}
                </p>
                <h2>
                  <Link href={`/articulo?id=${encodeURIComponent(lead.id)}`}>{lead.title}</Link>
                </h2>
                <p className="lana-case-excerpt">{lead.excerpt}</p>
                <div className="lana-case-fileline">
                  <span>Fecha del caso: {lead.dateFormatted}</span>
                  <span>Lectura: {lead.readingTime || 1} min</span>
                </div>
                <Link className="btn light on-dark lana-open-btn" href={`/articulo?id=${encodeURIComponent(lead.id)}`}>
                  Abrir el expediente
                </Link>
              </div>
              {lead.imageUrl && (
                <div className="lana-case-hero-photo">
                  {/* Editor-supplied URL, arbitrary host — see
                      components/sections/AboutSection.tsx's comment. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.imageUrl} alt={lead.title} width={900} height={560} decoding="async" />
                </div>
              )}
            </div>
          </section>
        ) : (
          <p className="empty-state hub-empty">Todavía no hay expedientes publicados.</p>
        )}

        {rest.length > 0 && (
          <section className="lana-archive" aria-label="Expedientes anteriores">
            <h2 className="lana-archive-head">Expedientes anteriores</h2>
            <div className="lana-archive-list">
              {rest.map(article => {
                const status = caseStatus(article, now);
                return (
                  <Link
                    className="lana-case-row"
                    href={`/articulo?id=${encodeURIComponent(article.id)}`}
                    key={article.id}
                  >
                    <span className="lana-case-number">Exp. {caseNumber(article, articles)}</span>
                    <span className="lana-case-row-main">
                      <h3>{article.title}</h3>
                      <span className="lana-case-row-date">{article.dateFormatted}</span>
                    </span>
                    <span className={`lana-stamp lana-stamp-${status}`}>
                      {status === 'abierto' ? 'Caso abierto' : 'Archivado'}
                    </span>
                  </Link>
                );
              })}
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource, getArticleById } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { productHubsContent } from '@/lib/product-hubs-content';
import { caseNumber, caseStatus, extractPullFigure, extractTrailStops } from '@/lib/product-hubs';
import { DeparturesBoard, type BoardRow } from '@/components/products/DeparturesBoard';
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

function Stamp({ status }: { status: 'abierto' | 'archivado' }) {
  return (
    <span className={`lana-stamp lana-stamp-${status}`}>
      {status === 'abierto' ? 'Caso abierto' : 'Archivado'}
    </span>
  );
}

// How many recent expedientes get their full body fetched to look for a
// declared "Ruta del dinero" to turn into an auto board row. Bounded so
// the hub stays a handful of cheap by-id lookups, not a table scan.
const AUTO_ROW_CANDIDATES = 3;

export default async function LaLanaHubPage() {
  const [articles, content] = await Promise.all([getArticlesBySource('la-lana'), getSiteContent()]);
  const hubs = productHubsContent(content.productHubs);
  const now = new Date();
  const [lead, ...rest] = articles;

  // The masthead departures board (user feedback 2026-08-05, third round
  // on this graphic: the labeled route line still read as abstract — the
  // board is the card art's own motif, and its rows should be the
  // CONNECTIONS the files uncovered, set as flights). Two sources, auto
  // rows first:
  //   - auto: recent expedientes whose body declares a "Ruta del dinero"
  //     become a departure (route as the connection, EXP. number as the
  //     flight, case status as the flight status, linked to the case);
  //   - curated: the CMS rows (Hubs tab), where editorial names the
  //     connections themselves — Infantino ↔ Trump, AR Monex ↔ Europa…
  const recentFull = await Promise.all(
    articles.slice(0, AUTO_ROW_CANDIDATES).map(a => getArticleById(a.id)),
  );
  const autoRows: BoardRow[] = [];
  for (const full of recentFull) {
    if (!full) continue;
    const stops = extractTrailStops(full.bodyHtml, full.teaser);
    if (!stops) continue;
    autoRows.push({
      fecha: full.dateFormatted,
      conexion: stops.join(' → '),
      expediente: `EXP. ${caseNumber(full, articles)}`,
      estado: caseStatus(full, now) === 'abierto' ? 'Abierto' : 'Archivado',
      url: `/articulo?id=${encodeURIComponent(full.id)}`,
    });
  }
  const boardRows: BoardRow[] = [...autoRows, ...hubs.lana.boardRows];

  return (
    <main className="hub hub-lana" id="la-lana">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-lana-masthead">
          <p className="hub-lana-eyebrow">{hubs.lana.eyebrow}</p>
          <h1 className="hub-lana-title">
            La Lana <span className="hub-lana-title-accent">del Deporte</span>
          </h1>
          <p className="hub-lana-sub">{hubs.lana.sub}</p>
          <DeparturesBoard label={hubs.lana.boardLabel} note={hubs.lana.boardNote} rows={boardRows} />
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

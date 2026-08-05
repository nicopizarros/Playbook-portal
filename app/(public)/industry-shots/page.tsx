import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { shotsFor, shotLabel, weekdayFor, MINUTES_PER_SHOT } from '@/lib/product-hubs';
import { SITE_URL } from '@/lib/site-url';

// Industry Shots — "El Trago" (design brief, 2026-08-05). Fast, frequent,
// disciplined: the hub is a dense vertical list built for scanning, not a
// magazine grid — the design rewards speed instead of slowing the reader
// down. The shot-bottle metaphor is functional: read time is measured in
// shots (1 shot ≈ 3 min, same unit the article page's progress glass
// uses), and the cadence badge (Martes/Jueves) is visible on every entry.
// Fixed-dark surface like the card art; blue accent per the brief.

export const metadata: Metadata = {
  title: 'Industry Shots — El Trago',
  description:
    'Lo que debes saber de sports business en menos de 5 minutos. Todas las ediciones de Industry Shots, martes y jueves.',
  alternates: { canonical: `${SITE_URL}/industry-shots` },
};

const CADENCE_DAYS = new Set(['Martes', 'Jueves']);

// A tiny filled-glass glyph per shot so length is scannable without
// reading the label; capped so a long read doesn't become a shelf.
const MAX_GLYPHS = 3;

function ShotGlyphs({ shots }: { shots: number }) {
  return (
    <span className="shots-glyphs" aria-hidden="true">
      {Array.from({ length: Math.min(shots, MAX_GLYPHS) }, (_, i) => (
        <svg key={i} viewBox="0 0 36 48" width="11" height="15" focusable="false">
          <path d="M7 12 L29 12 L25.5 42 L10.5 42 Z" className="shots-glyph-fill" />
          <path d="M5 8 L31 8 L26.5 45 L9.5 45 Z" fill="none" className="shots-glyph-outline" />
        </svg>
      ))}
    </span>
  );
}

export default async function IndustryShotsHubPage() {
  const articles = await getArticlesBySource('industry-shots');

  return (
    <main className="hub hub-shots" id="industry-shots">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-shots-masthead">
          <p className="hub-shots-eyebrow">By Playbook</p>
          <h1 className="hub-shots-title">Industry Shots</h1>
          <p className="hub-shots-sub">
            Lo que debes saber de sports business para tomar mejores decisiones, en menos de 5 minutos.
          </p>
          <p className="hub-shots-cadence">
            <span className="shots-badge">Martes</span>
            <span className="shots-badge">Jueves</span>
            <span className="hub-shots-measure">1 shot ≈ {MINUTES_PER_SHOT} min</span>
          </p>
        </header>

        {articles.length ? (
          <section className="shots-list" aria-label="Todas las ediciones">
            {articles.map(article => {
              const weekday = weekdayFor(article.date);
              const shots = shotsFor(article.readingTime);
              return (
                <Link
                  className="shots-row"
                  href={`/articulo?id=${encodeURIComponent(article.id)}`}
                  key={article.id}
                >
                  <span className="shots-row-when">
                    <span
                      className={`shots-badge${CADENCE_DAYS.has(weekday) ? '' : ' shots-badge-off'}`}
                    >
                      {weekday}
                    </span>
                    <span className="shots-row-date">{article.dateFormatted}</span>
                  </span>
                  <h3 className="shots-row-title">{article.title}</h3>
                  <span className="shots-row-measure">
                    <ShotGlyphs shots={shots} />
                    {shotLabel(article.readingTime)}
                  </span>
                </Link>
              );
            })}
          </section>
        ) : (
          <p className="empty-state hub-empty">Todavía no hay ediciones publicadas.</p>
        )}

        <div className="hub-foot">
          <Link className="section-link hub-foot-link" href="/archivo?source=industry-shots">
            Ver Noticias en el archivo general →
          </Link>
        </div>
      </div>
    </main>
  );
}

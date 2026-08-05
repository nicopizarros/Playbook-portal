import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { shotsFor, shotLabel, weekdayFor, MINUTES_PER_SHOT } from '@/lib/product-hubs';
import { SITE_URL } from '@/lib/site-url';

// Noticias — the news product's own front page (design brief 2026-08-05,
// reworked same day on user feedback: the page is called NOTICIAS — the
// name readers see everywhere else on the portal — not "Industry Shots";
// the accent is Playbook green, not an imported blue; and the weekday
// badges lost their two-tone treatment, which read as random colors
// against real off-cadence publish days. /industry-shots 301s here.)
//
// The design still rewards scanning speed — a dense vertical list, not a
// magazine grid — but importance now shows through TYPE SIZE: the latest
// edition leads big, and each row's headline scales with its editorial
// priority, so the eye lands on what matters without reading dates. The
// shot measure stays as the reading unit (1 shot ≈ 3 min, the same unit
// the article page's progress glass uses).

export const metadata: Metadata = {
  title: 'Noticias',
  description:
    'Lo que debes saber de sports business en menos de 5 minutos. Todas las noticias de Playbook, martes y jueves.',
  alternates: { canonical: `${SITE_URL}/noticias` },
};

// Headline scale per editorial priority (the same 1-5 stars the homepage
// ranks with): the row's size IS the importance signal.
function tierFor(priority: number | null): 'lg' | 'md' | 'sm' {
  if ((priority ?? 0) >= 5) return 'lg';
  if ((priority ?? 0) >= 4) return 'md';
  return 'sm';
}

function ShotGlyph() {
  return (
    <svg viewBox="0 0 36 48" width="11" height="15" aria-hidden="true" focusable="false">
      <path d="M7 12 L29 12 L25.5 42 L10.5 42 Z" className="shots-glyph-fill" />
      <path d="M5 8 L31 8 L26.5 45 L9.5 45 Z" fill="none" className="shots-glyph-outline" />
    </svg>
  );
}

export default async function NoticiasHubPage() {
  const articles = await getArticlesBySource('industry-shots');
  const [lead, ...rest] = articles;

  return (
    <main className="hub hub-shots" id="noticias-hub">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-shots-masthead">
          <p className="hub-shots-eyebrow">By Playbook</p>
          <h1 className="hub-shots-title">Noticias</h1>
          <p className="hub-shots-sub">
            Lo que debes saber de sports business para tomar mejores decisiones, en menos de 5 minutos.
          </p>
          <p className="hub-shots-cadence">
            Nuevas ediciones <strong>martes y jueves</strong>
            <span className="hub-shots-measure">· 1 shot ≈ {MINUTES_PER_SHOT} min</span>
          </p>
        </header>

        {lead ? (
          <section className="shots-lead reveal" aria-label="Última edición">
            <Link className="shots-lead-link" href={`/articulo?id=${encodeURIComponent(lead.id)}`}>
              <span className="shots-lead-when">
                <span className="shots-badge">{weekdayFor(lead.date)}</span>
                <span className="shots-row-date">{lead.dateFormatted}</span>
              </span>
              <h2 className="shots-lead-title">{lead.title}</h2>
              {lead.excerpt && <p className="shots-lead-excerpt">{lead.excerpt}</p>}
              <span className="shots-row-measure">
                <ShotGlyph />
                {shotLabel(lead.readingTime)}
              </span>
            </Link>
          </section>
        ) : (
          <p className="empty-state hub-empty">Todavía no hay ediciones publicadas.</p>
        )}

        {rest.length > 0 && (
          <section className="shots-list" aria-label="Ediciones anteriores">
            {rest.map(article => {
              const shots = shotsFor(article.readingTime);
              return (
                <Link
                  className="shots-row"
                  data-tier={tierFor(article.priority)}
                  href={`/articulo?id=${encodeURIComponent(article.id)}`}
                  key={article.id}
                >
                  <span className="shots-row-when">
                    <span className="shots-badge">{weekdayFor(article.date)}</span>
                    <span className="shots-row-date">{article.dateFormatted}</span>
                  </span>
                  <h3 className="shots-row-title">{article.title}</h3>
                  <span className="shots-row-measure">
                    {Array.from({ length: Math.min(shots, 3) }, (_, i) => (
                      <ShotGlyph key={i} />
                    ))}
                    {shotLabel(article.readingTime)}
                  </span>
                </Link>
              );
            })}
          </section>
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

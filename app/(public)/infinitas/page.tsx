import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { Scoreboard, type ScoreboardMetric } from '@/components/products/Scoreboard';
import { SITE_URL } from '@/lib/site-url';

// Infinitas — "El Marcador" (design brief, 2026-08-05). Flat violet, final
// identity, deliberately clean: the ONE product that does not borrow the
// grunge language of the other three. The narrative — women's sports as a
// business force to be reckoned with — is structural: a scoreboard of real
// business growth metrics ticks upward as the reader arrives, so the
// thesis is something they watch happen. Photography is treated with a
// violet duotone overlay (CSS, see .inf-duotone) to stay inside the flat
// system rather than importing grit.

export const metadata: Metadata = {
  title: 'Infinitas — El Marcador',
  description:
    'El negocio del deporte femenil: cifras, patrocinios y quién le está apostando fuerte. La nueva era del deporte, leída como industria.',
  alternates: { canonical: `${SITE_URL}/infinitas` },
};

// El Marcador's opening metrics. Real, attributed public figures — a
// scoreboard invents nothing. Values chosen with editorial care but frozen
// at write time (2026-08-05): confirm/refresh with the Infinitas team each
// season, or wire to the CMS if they want to own them (the component
// already takes them as data).
const SCOREBOARD: ScoreboardMetric[] = [
  {
    value: 2.35,
    decimals: 2,
    prefix: 'US$',
    suffix: 'B',
    label: 'Ingresos globales del deporte femenil de élite proyectados para 2025',
    source: 'Deloitte',
  },
  {
    value: 91553,
    label: 'Récord mundial de asistencia a un partido de fútbol femenil (Camp Nou, 2022)',
    source: 'FC Barcelona',
  },
  {
    value: 1.98,
    decimals: 2,
    suffix: 'M',
    label: 'Asistentes al Mundial Femenil 2023, récord histórico del torneo',
    source: 'FIFA',
  },
];

export default async function InfinitasHubPage() {
  const articles = await getArticlesBySource('infinitas');
  const [lead, ...rest] = articles;

  return (
    <main className="hub hub-infinitas" id="infinitas-hub">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-inf-masthead">
          <p className="hub-inf-eyebrow">By Playbook</p>
          <h1 className="hub-inf-title">infinitas</h1>
          <p className="hub-inf-sub">La nueva era del deporte, leída como industria.</p>
        </header>

        <section className="inf-marcador" aria-label="El Marcador">
          <h2 className="inf-marcador-head">El Marcador</h2>
          <p className="inf-marcador-sub">
            El deporte femenil como fuerza de negocio, en cifras que no dejan de subir.
          </p>
          <Scoreboard metrics={SCOREBOARD} />
        </section>

        {lead ? (
          <section className="inf-lead" aria-label="Historia principal">
            <Link className="inf-lead-card" href={`/articulo?id=${encodeURIComponent(lead.id)}`}>
              {lead.imageUrl && (
                <span className="inf-duotone">
                  {/* Editor-supplied URL, arbitrary host — see
                      components/sections/AboutSection.tsx's comment. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.imageUrl} alt={lead.title} width={1200} height={750} decoding="async" />
                </span>
              )}
              <span className="inf-lead-copy">
                <span className="inf-kicker">Historia principal</span>
                <h3>{lead.title}</h3>
                <p>{lead.excerpt}</p>
                <span className="byline">
                  {lead.dateFormatted} · {lead.readingTime || 1} min
                </span>
              </span>
            </Link>
          </section>
        ) : (
          <p className="empty-state hub-empty">Todavía no hay historias publicadas.</p>
        )}

        {rest.length > 0 && (
          <section className="inf-grid" aria-label="Más de Infinitas">
            {rest.map(article => (
              <Link
                className="inf-card"
                href={`/articulo?id=${encodeURIComponent(article.id)}`}
                key={article.id}
              >
                {article.imageUrl && (
                  <span className="inf-duotone">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.imageUrl} alt="" width={600} height={400} loading="lazy" decoding="async" />
                  </span>
                )}
                <h3>{article.title}</h3>
                <span className="byline">
                  {article.dateFormatted} · {article.readingTime || 1} min
                </span>
              </Link>
            ))}
          </section>
        )}

        <div className="hub-foot">
          <Link className="section-link hub-foot-link" href="/archivo?source=infinitas">
            Ver Infinitas en el archivo general →
          </Link>
        </div>
      </div>
    </main>
  );
}

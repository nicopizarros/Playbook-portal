import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticlesBySource } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { productHubsContent, type HubMetric } from '@/lib/product-hubs-content';
import { Scoreboard, type ScoreboardMetric } from '@/components/products/Scoreboard';
import { SITE_URL } from '@/lib/site-url';

// Infinitas — "El Marcador" (design brief, 2026-08-05). Flat violet, final
// identity, deliberately clean: the ONE product that does not borrow the
// grunge language of the other three. The narrative — women's sports as a
// business force to be reckoned with — is structural: a scoreboard of real
// business growth metrics ticks upward as the reader arrives, so the
// thesis is something they watch happen. Photography is treated with a
// violet duotone overlay (CSS, see .infhub-duotone) to stay inside the
// flat system rather than importing grit.
//
// Class names are all infhub-* — NOT inf-* — because the homepage's
// Infinitas section already owns .inf-grid/.inf-card (dark overlay cards
// in styles/sections.css) and the first pass of this page collided with
// them: dark-ink titles rendered on those dark card boxes, the exact
// unreadability the user reported (2026-08-05). Keep the prefixes apart.

export const metadata: Metadata = {
  title: 'Infinitas — El Marcador',
  description:
    'El negocio del deporte femenil: cifras, patrocinios y quién le está apostando fuerte. La nueva era del deporte, leída como industria.',
  alternates: { canonical: `${SITE_URL}/infinitas` },
};

// El Marcador's metrics are CMS-owned as of 2026-08-05 (Hubs tab in the
// admin; defaults in lib/data/site-content.ts's PRODUCT_HUBS_DEFAULTS) —
// editorial refreshes them without a deploy. The editor types the number
// as text ("2.35", "91,553"); this parses it and derives the decimal
// count for the count-up animation. Unparseable or empty values are
// dropped rather than animating to 0.
function toScoreboardMetric(metric: HubMetric): ScoreboardMetric | null {
  const raw = metric.value.trim().replace(/,/g, '');
  const value = Number(raw);
  if (!raw || Number.isNaN(value)) return null;
  return {
    value,
    decimals: raw.includes('.') ? Math.min(raw.split('.')[1].length, 3) : 0,
    prefix: metric.prefix || undefined,
    suffix: metric.suffix || undefined,
    label: metric.label,
    source: metric.source,
  };
}

export default async function InfinitasHubPage() {
  const [articles, content] = await Promise.all([getArticlesBySource('infinitas'), getSiteContent()]);
  const hub = productHubsContent(content.productHubs).infinitas;
  const metrics = hub.metrics.map(toScoreboardMetric).filter((m): m is ScoreboardMetric => m !== null);
  // Main story: the edition editorial pins in the CMS (Hubs tab) when it
  // still resolves, else the most recent one — same contract as TFBR's
  // cover report, and deliberately not the site-wide `featured` flag, so
  // leading this hub never moves the homepage's top story.
  const lead = articles.find(a => a.id === hub.leadId) ?? articles[0] ?? null;
  const rest = articles.filter(a => a.id !== lead?.id);

  return (
    <main className="hub hub-infinitas" id="infinitas-hub">
      <div className="container">
        <Link className="section-link back-link hub-back" href="/">← Volver a Playbook</Link>

        <header className="hub-inf-masthead">
          <p className="hub-inf-eyebrow">By Playbook</p>
          <h1 className="hub-inf-title">infinitas</h1>
          <p className="hub-inf-sub">{hub.sub}</p>
        </header>

        {metrics.length > 0 && (
          <section className="infhub-marcador" aria-label="El Marcador">
            <h2 className="infhub-marcador-head">El Marcador</h2>
            <p className="infhub-marcador-sub">{hub.marcadorSub}</p>
            <Scoreboard metrics={metrics} />
          </section>
        )}

        {lead ? (
          <section className="infhub-lead" aria-label="Historia principal">
            <Link className="infhub-lead-card" href={`/articulo?id=${encodeURIComponent(lead.id)}`}>
              {lead.imageUrl && (
                <span className="infhub-duotone">
                  {/* Editor-supplied URL, arbitrary host — see
                      components/sections/AboutSection.tsx's comment. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.imageUrl} alt={lead.title} width={1200} height={750} decoding="async" />
                </span>
              )}
              <span className="infhub-lead-copy">
                <span className="infhub-kicker">Historia principal</span>
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
          <section className="infhub-grid" aria-label="Más de Infinitas">
            {rest.map(article => (
              <Link
                className="infhub-card"
                href={`/articulo?id=${encodeURIComponent(article.id)}`}
                key={article.id}
              >
                {article.imageUrl && (
                  <span className="infhub-duotone">
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

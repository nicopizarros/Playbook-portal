import type { Metadata } from 'next';
import Link from 'next/link';
import { getTeamMembers, getTeamPageStats } from '@/lib/data/team';
import { jsonLdScript } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Equipo',
  description:
    'Quién hace Playbook: el equipo editorial detrás de la cobertura del negocio del deporte en México y LATAM.',
  alternates: { canonical: `${SITE_URL}/equipo` },
  robots: { index: true, follow: true },
};

// Same "read live data, don't prerender a stale snapshot" reasoning as the
// rest of app/(public) — the roster and the stat strip both come from
// Postgres/GA4 at request time.
export const dynamic = 'force-dynamic';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-MX').format(n);
}

export default async function EquipoPage() {
  const [members, stats] = await Promise.all([getTeamMembers(), getTeamPageStats()]);

  // Person markup per real byline — SEO promise #1: search engines connect
  // the name to the work even for a member with no profile yet, since the
  // link to their archive is real regardless of whether a bio exists.
  const peopleJsonLd = jsonLdScript(
    members.map(m => ({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: m.name,
      url: `${SITE_URL}/autor?nombre=${encodeURIComponent(m.name)}`,
      ...(m.profile?.role ? { jobTitle: m.profile.role } : {}),
      worksFor: { '@id': `${SITE_URL}#organization` },
    })),
  );

  const statTiles = [
    stats.registeredReaders !== null && {
      value: formatNumber(stats.registeredReaders),
      label: 'Lectores registrados',
    },
    stats.reachAvailable &&
      stats.monthlyVisitors !== null && {
        value: formatNumber(stats.monthlyVisitors),
        label: 'Visitantes únicos · últimos 30 días',
      },
    stats.reachAvailable &&
      stats.monthlyPageviews !== null && {
        value: formatNumber(stats.monthlyPageviews),
        label: 'Páginas vistas · últimos 30 días',
      },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <main className="container team-page" id="equipo-main">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: peopleJsonLd }} />

      <header className="team-hero">
        <span className="eyebrow">Equipo</span>
        <h1>Quién hace Playbook</h1>
        <p className="team-dek">
          Periodismo de negocios del deporte para México y LATAM: capital, franquicias, patrocinios,
          derechos y las decisiones detrás del juego. Esto es quién lo reporta.
        </p>
      </header>

      {statTiles.length > 0 && (
        <section className="team-stats" aria-label="Alcance de Playbook">
          {statTiles.map(tile => (
            <div className="team-stat" key={tile.label}>
              <span className="team-stat-value">{tile.value}</span>
              <span className="team-stat-label">{tile.label}</span>
            </div>
          ))}
        </section>
      )}

      {members.length > 0 ? (
        <section className="team-grid" aria-label="Equipo editorial">
          {members.map(m => (
            <article className="team-card" key={m.name}>
              <div className="team-avatar" aria-hidden="true">
                {m.profile?.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.profile.photo} alt="" width={112} height={112} loading="lazy" decoding="async" />
                ) : (
                  <span>{initials(m.name)}</span>
                )}
              </div>
              <h2 className="team-card-name">{m.name}</h2>
              {m.profile?.role && <p className="team-card-role">{m.profile.role}</p>}
              {m.profile?.beat && <p className="team-card-beat">{m.profile.beat}</p>}
              {m.profile?.bio && <p className="team-card-bio">{m.profile.bio}</p>}
              <Link className="team-card-link" href={`/autor?nombre=${encodeURIComponent(m.name)}`}>
                {m.articleCount === 1 ? '1 artículo publicado' : `${m.articleCount} artículos publicados`} →
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <p className="empty-state">Todavía no hay artículos con autor asignado.</p>
      )}

      <section className="team-cta">
        <div>
          <span className="eyebrow">Alianzas y publicidad</span>
          <h2>Trabaja con Playbook</h2>
          <p>
            Llegamos a quienes deciden en el negocio del deporte en México y LATAM. Si buscas una
            alianza, patrocinio o espacio publicitario, hablemos.
          </p>
        </div>
        <Link className="btn accent" href="/contacto">
          Contactar al equipo →
        </Link>
      </section>
    </main>
  );
}

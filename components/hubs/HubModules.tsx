import Link from 'next/link';
import type { Article } from '@/lib/data/articles';
import type { Hub } from '@/lib/hubs';
import { PRODUCT_HUBS } from '@/lib/product-hubs';
import { MexicoMap } from './MexicoMap';

// Not lib/constants.ts's SOURCE_LABELS: that map is typed to four `Source`
// values and has NO entry for 'futbol-business-review', even though 14
// published rows carry it (verified against production, 2026-08-18).
// PRODUCT_HUBS is the complete list. Flagged in docs/TODO.md rather than
// fixed here — it is a pre-existing gap in a shared constant, not this
// feature's to change.
function sourceLabel(source: string): string {
  return PRODUCT_HUBS.find(h => h.source === source)?.name ?? source;
}
import { HubSource } from './HubSource';

/** El estado comercial — the numbers that make the case. */
export function HubFigures({ hub }: { hub: Hub }) {
  if (!hub.commercialState.length) return null;
  return (
    <section className="hubx-section" aria-labelledby="hubx-state">
      <p className="hubx-kicker">El negocio</p>
      <h2 className="hubx-head" id="hubx-state">El estado comercial</h2>
      <p className="hubx-sub">Lo que hace de esta propiedad una historia de negocio.</p>
      <div className="hubx-figures">
        {hub.commercialState.map(figure => (
          <div className="hubx-figure" key={figure.label}>
            <span className="hubx-figure-value">{figure.value}</span>
            <span className="hubx-figure-label">{figure.label}</span>
            <HubSource source={figure.source} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Plazas as COMMERCIAL MARKETS, which is the only framing that earns this
 * module a place on a business page — a map of team locations is a
 * scores-site artefact. `marketNote` answers "what is a sponsor buying
 * here"; where nobody has supplied a sourced answer it stays empty rather
 * than being filled with invention.
 */
export function HubPlazas({ hub }: { hub: Hub }) {
  if (!hub.plazas.length) return null;
  const announced = hub.plazas.filter(p => p.status === 'anunciada').length;
  // Only render the commercial column if at least one plaza actually has a
  // sourced answer. Eleven rows of "sin dato" is not transparency, it is a
  // module that looks broken.
  const hasMarketNotes = hub.plazas.some(p => Boolean(p.marketNote));
  const hasTeams = hub.plazas.some(p => Boolean(p.team));
  const hasMap = hub.plazas.some(p => Boolean(p.state));
  return (
    <section className="hubx-section" aria-labelledby="hubx-plazas">
      <p className="hubx-kicker">El mapa</p>
      <h2 className="hubx-head" id="hubx-plazas">Las plazas</h2>
      <p className="hubx-sub">
        {hub.plazas.length - announced} plazas establecidas
        {announced > 0 && <> y {announced} anunciadas</>}, leídas como mercados comerciales.
      </p>
      <div className={hasMap ? 'hubx-plazas-wrap' : undefined}>
        {hasMap && <MexicoMap hub={hub} />}
      <table className="hubx-plazas">
        <thead>
          <tr>
            <th scope="col">Plaza</th>
            {hasTeams && <th scope="col">Equipo</th>}
            {hasMarketNotes && <th scope="col">Qué compra un patrocinador</th>}
            <th scope="col">Estatus</th>
          </tr>
        </thead>
        <tbody>
          {hub.plazas.map(plaza => (
            <tr key={`${plaza.city}-${plaza.status}`}>
              <th scope="row">
                {plaza.city}
                {plaza.region && plaza.region !== plaza.city && (
                  <span className="hubx-plaza-region">{plaza.region}</span>
                )}
              </th>
              {/* Cell order must match the header order above: Plaza,
                  Equipo, Estatus. An earlier pass inserted the team cell
                  after the status cell and the columns silently swapped. */}
              {hasTeams && <td>{plaza.team || '—'}</td>}
              {hasMarketNotes && <td>{plaza.marketNote || '—'}</td>}
              <td>
                <span className="hubx-status" data-status={plaza.status}>
                  {plaza.status === 'anunciada' ? 'Anunciada' : 'Establecida'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}

/**
 * The season spine. Section 4 says "only if the content supports it" — so
 * it hides itself below two beats. One dated anchor is not a timeline, and
 * a one-item timeline padded out to look like a season is exactly the
 * padding the brief forbids.
 */
export function HubSeason({ hub }: { hub: Hub }) {
  if (hub.season.length < 2) return null;
  return (
    <section className="hubx-section" aria-labelledby="hubx-season">
      <p className="hubx-kicker">El calendario</p>
      <h2 className="hubx-head" id="hubx-season">La temporada</h2>
      <ul className="hubx-season">
        {hub.season.map(beat => (
          <li key={beat.label}>
            <span className="hubx-season-when">{beat.when}</span>
            <span className="hubx-season-label">{beat.label}</span>
            {beat.note && <span className="hubx-sub" style={{ margin: 0 }}>{beat.note}</span>}
            <HubSource source={beat.source} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The coverage stream. Empty today (0 tagged articles at build time, see
 * the 2026-08-18 backfill) — so the empty state is the state this hub
 * SHIPS in, and it gets designed rather than defaulted. It reads as an
 * invitation and points at the archive, instead of apologising.
 */
export function HubStream({ hub, articles }: { hub: Hub; articles: Article[] }) {
  return (
    <section className="hubx-section" aria-labelledby="hubx-stream">
      <p className="hubx-kicker">Noticias</p>
      <h2 className="hubx-head" id="hubx-stream">Lo último</h2>
      {articles.length > 0 ? (
        <>
          <p className="hubx-sub">
            {articles.length === 1
              ? `1 pieza etiquetada como cobertura de ${hub.name}.`
              : `${articles.length} piezas etiquetadas como cobertura de ${hub.name}.`}
          </p>
          <div className="hubx-stream">
            {articles.map(article => (
              <Link
                className="hubx-item"
                key={article.id}
                href={`/articulo?id=${encodeURIComponent(article.id)}`}
              >
                <span className="hubx-item-title">{article.title}</span>
                <span className="hubx-item-meta">
                  {sourceLabel(article.source)} · {article.dateFormatted}
                  {article.readingTime ? ` · ${article.readingTime} min` : ''}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="hubx-empty">
          <p className="hubx-empty-head">{hub.emptyState.heading}</p>
          <p className="hubx-empty-body">{hub.emptyState.body}</p>
        </div>
      )}
    </section>
  );
}

/** Cross-links to the editorial products that cover this beat. */
export function HubCross({ hub }: { hub: Hub }) {
  if (!hub.relatedSources.length) return null;
  return (
    <section className="hubx-section" aria-labelledby="hubx-cross">
      <p className="hubx-kicker">En Playbook</p>
      <h2 className="hubx-head" id="hubx-cross">Dónde seguirlo</h2>
      <p className="hubx-sub">Los productos editoriales donde aparece esta cobertura.</p>
      <div className="hubx-cross">
        {hub.relatedSources.map(source => (
          <Link className="section-link" key={source} href={`/archivo?source=${source}`}>
            {sourceLabel(source)} →
          </Link>
        ))}
      </div>
    </section>
  );
}

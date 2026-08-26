import Link from 'next/link';
import type { Article } from '@/lib/data/articles';
import type { Hub, HubFigure } from '@/lib/hubs';
import { PRODUCT_HUBS } from '@/lib/product-hubs';
import { MexicoMap } from './MexicoMap';
import { NewsletterForm } from '@/components/shared/NewsletterForm';

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

/**
 * El tablero — the numbers that make the case, on the hub's one LIGHT
 * plane.
 *
 * FULL-BLEED, so it renders OUTSIDE the page's .container and opens its own
 * (see app/(public)/coberturas/[slug]/page.tsx). The tonal break is the
 * point: the rest of the hub is a dark reading column, and a page with no
 * change of surface reads as one undifferentiated scroll however good the
 * type is. This is where the reader is asked to stop and look at figures.
 */
function HubFigureGrid({ figures, showSources }: { figures: HubFigure[]; showSources: boolean }) {
  return (
    <div className="hubx-figures">
      {figures.map(figure => (
        <div className="hubx-figure" key={figure.label}>
          <span className="hubx-figure-value">{figure.value}</span>
          <div>
            <span className="hubx-figure-label">{figure.label}</span>
            {showSources ? <HubSource source={figure.source} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * EL TABLERO — the board. Two bands on one light plane.
 *
 * `commercialState` is the supply side: what has been committed to the
 * property. `audience` is the demand side: what it has to sell. They are
 * one argument and share a surface, which is why the audience figures are a
 * second band here rather than a stats strip appended to the page — a bar
 * at the end reads as an afterthought and makes the reader do the joining.
 *
 * The board renders if EITHER band has content, so a hub with audience data
 * and no commercial figures still gets a board.
 */
export function HubFigures({ hub }: { hub: Hub }) {
  const { audience } = hub;
  const hasState = hub.commercialState.length > 0;
  const hasAudience = Boolean(audience?.figures.length);
  if (!hasState && !hasAudience) return null;

  // One credit for the whole band, but ONLY when every figure genuinely
  // shares it. The moment a figure arrives from a different study the band
  // falls back to per-figure chips, so a number can never end up sitting
  // silently under someone else's attribution. See HubAudience's note.
  const audienceSourcesAgree =
    hasAudience &&
    new Set(audience!.figures.map(f => f.source.label)).size === 1;

  return (
    <div className="hubx-board" id="tablero">
      <div className="container">
        {hasState ? (
          <section className="hubx-section" aria-labelledby="hubx-state">
            <p className="hubx-kicker">El negocio</p>
            <h2 className="hubx-head" id="hubx-state">El estado comercial</h2>
            <p className="hubx-sub">Lo que hace de esta propiedad una historia de negocio.</p>
            <HubFigureGrid figures={hub.commercialState} showSources />
          </section>
        ) : null}

        {hasAudience ? (
          <section className="hubx-section hubx-board-band" id="aficion" aria-labelledby="hubx-audience">
            <p className="hubx-kicker">{audience!.kicker}</p>
            <h2 className="hubx-head" id="hubx-audience">{audience!.heading}</h2>
            {audience!.sub ? <p className="hubx-sub">{audience!.sub}</p> : null}
            <HubFigureGrid figures={audience!.figures} showSources={!audienceSourcesAgree} />
            {/* Unconditional, unlike HubSource: this is a licence
                obligation to the owner of the dataset, not a citation
                backlog marker. It renders with or without a public URL. */}
            <p className="hubx-credit">{audience!.credit}</p>
          </section>
        ) : null}
      </div>
    </div>
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
    <section className="hubx-section" id="plazas" aria-labelledby="hubx-plazas">
      <p className="hubx-kicker">El mapa</p>
      <h2 className="hubx-head" id="hubx-plazas">Las plazas</h2>
      <p className="hubx-sub">
        {hub.plazas.length - announced} plazas establecidas
        {announced > 0 && <> y {announced} anunciadas</>}, leídas como mercados comerciales.
      </p>
      <div className={hasMap ? 'hubx-plazas-wrap' : undefined}>
        {/* The map gets a panel of its own rather than floating on the page
            ground. Without one it reads as an illustration that wandered in;
            inside a plane with the same border and radius as the table
            beside it, the two read as one module. */}
        {hasMap && (
          <div className="hubx-map-panel">
            <MexicoMap hub={hub} />
          </div>
        )}
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
            <tr key={`${plaza.city}-${plaza.status}`} data-state-key={plaza.state}>
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
    <section className="hubx-section" id="temporada" aria-labelledby="hubx-season">
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

function articleMeta(article: Article): string {
  const bits = [sourceLabel(article.source), article.dateFormatted];
  if (article.readingTime) bits.push(`${article.readingTime} min`);
  return bits.join(' · ');
}

/** The card used for every article that is not the lead. */
function HubItem({ article }: { article: Article }) {
  return (
    <Link className="hubx-item" href={`/articulo?id=${encodeURIComponent(article.id)}`}>
      <span className="hubx-item-title">{article.title}</span>
      <span className="hubx-item-meta">{articleMeta(article)}</span>
    </Link>
  );
}

/**
 * The coverage stream — LEAD, RAIL, GRID.
 *
 * A hub opens with content, and the 2026-08-19 mockup is right about why:
 * the reason to come back to a coverage destination is to find out what
 * happened, not to read a factsheet. What the mockup adds that the first
 * build did not have is HIERARCHY — the newest important piece gets a
 * photograph and display type, the next two get a rail, the rest fall into
 * a flat grid.
 *
 * The lead is position 1 out of rankArticles() (lib/hubs/pool.ts), not a
 * hub-local featured flag: the ranking already encodes "most important
 * recent thing", and a second, hub-only pinning mechanism would be one more
 * switch nobody remembers to flip.
 *
 * DEGRADATION, in the order it actually happens:
 *   • no articles  → the designed empty state, unchanged
 *   • 1 article    → lead spans the full width (data-rail="false")
 *   • 2-3          → lead + rail
 *   • 4+           → lead + rail + grid
 *   • lead has no imageUrl → the card renders without the <img>, keeping
 *     its scrim and its type over the plane colour. Every published article
 *     is supposed to carry a cover (images.md), but the module must not
 *     collapse on the one that doesn't.
 */
export function HubStream({ hub, articles }: { hub: Hub; articles: Article[] }) {
  const [lead, ...rest] = articles;
  const rail = rest.slice(0, 2);
  const grid = rest.slice(2);

  return (
    <section className="hubx-section" id="lo-ultimo" aria-labelledby="hubx-stream">
      <p className="hubx-kicker">Noticias</p>
      <h2 className="hubx-head" id="hubx-stream">Lo último</h2>
      {lead ? (
        <>
          <p className="hubx-sub">
            {articles.length === 1
              ? `1 pieza etiquetada como cobertura de ${hub.name}.`
              : `${articles.length} piezas etiquetadas como cobertura de ${hub.name}.`}
          </p>
          <div className="hubx-latest" data-rail={rail.length > 0}>
            <Link className="hubx-lead" href={`/articulo?id=${encodeURIComponent(lead.id)}`}>
              {lead.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img className="hubx-lead-photo" src={lead.imageUrl} alt="" loading="lazy" />
              )}
              <div className="hubx-lead-copy">
                <span className="hubx-lead-kicker">{sourceLabel(lead.source)}</span>
                <h3 className="hubx-lead-title">{lead.title}</h3>
                {(lead.teaser || lead.excerpt) && (
                  <p className="hubx-lead-dek">{lead.teaser || lead.excerpt}</p>
                )}
                <span className="hubx-lead-meta">{articleMeta(lead)}</span>
              </div>
            </Link>
            {rail.length > 0 && (
              <div className="hubx-side">
                {rail.map(article => <HubItem article={article} key={article.id} />)}
              </div>
            )}
          </div>
          {grid.length > 0 && (
            <div className="hubx-stream">
              {grid.map(article => <HubItem article={article} key={article.id} />)}
            </div>
          )}
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

/**
 * Temas que seguimos — Playbook's own coverage commitment for the year, not
 * a claim about the property (see HubPillar's comment). Numbered so it
 * reads as a declared list rather than a decorative grid.
 */
export function HubPillars({ hub }: { hub: Hub }) {
  if (!hub.pillars?.length) return null;
  return (
    <section className="hubx-section" id="temas" aria-labelledby="hubx-pillars">
      <p className="hubx-kicker">Radar editorial</p>
      <h2 className="hubx-head" id="hubx-pillars">Temas que seguimos</h2>
      <p className="hubx-sub">Los frentes de negocio que Playbook cubre en esta propiedad todo el año.</p>
      <div className="hubx-pillars">
        {hub.pillars.map((pillar, i) => (
          <div className="hubx-pillar" key={pillar.title}>
            <span className="hubx-pillar-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3>{pillar.title}</h3>
            <p>{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Momentos clave — the property's own recurring annual shape, and the
 * business story each phase opens up. Same "needs real content" discipline
 * as HubSeason: fewer than two phases is not a calendar, so it hides.
 */
export function HubMoments({ hub }: { hub: Hub }) {
  if (!hub.momentsClave || hub.momentsClave.length < 2) return null;
  return (
    <section className="hubx-section" id="momentos" aria-labelledby="hubx-moments">
      <p className="hubx-kicker">El calendario del negocio</p>
      <h2 className="hubx-head" id="hubx-moments">Momentos clave</h2>
      <p className="hubx-sub">Cada etapa de la temporada activa una historia de negocio distinta.</p>
      <ol className="hubx-moments">
        {hub.momentsClave.map(moment => (
          <li className={moment.highlight ? 'is-highlight' : undefined} key={moment.label}>
            <span className="hubx-moment-dot" aria-hidden="true" />
            <h3>{moment.label}</h3>
            <p>{moment.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Desde adentro — the access PROMISE, beside a photograph of the property.
 *
 * The mockup pairs this module with a video card: a play button, a headline
 * and the label "DEMO INTERNO". That card is the one thing on the mockup
 * this build refuses to copy. No interview and no clip exists, and a play
 * button is a promise of content — the same fabrication the provenance rule
 * forbids for a figure, applied to a piece of content instead of a number.
 *
 * What survives the objection is the LAYOUT, which was the good idea: a
 * photograph carrying the access promise, beside the list of what that
 * access actually covers. So the panel is a poster. It has no play button,
 * no timestamp, and nothing on it is clickable — and the day a real
 * interview exists, it becomes the lead of the coverage stream above like
 * any other published piece, not a special case here.
 */
export function HubAccess({ hub }: { hub: Hub }) {
  if (!hub.access?.length) return null;
  const photo = hub.accessPhoto;
  return (
    <section className="hubx-section" id="adentro" aria-labelledby="hubx-access">
      <p className="hubx-kicker">Acceso</p>
      <h2 className="hubx-head" id="hubx-access">Desde adentro</h2>
      <p className="hubx-sub">Lo que la alianza pone a disposición del lector, más allá de una cobertura temática normal.</p>
      <div className="hubx-inside" data-art={Boolean(photo)}>
        {photo && (
          <div className="hubx-inside-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt} loading="lazy" />
            <div className="hubx-inside-copy">
              <h3>Lo que pasa fuera del campo</h3>
              <p>
                Conversaciones con la liga, franquicias, socios e inversionistas sobre las
                decisiones que normalmente no llegan a la cobertura deportiva.
              </p>
            </div>
            {photo.credit && <span className="hubx-inside-credit">{photo.credit}</span>}
          </div>
        )}
        <div className="hubx-access">
          {hub.access.map(item => (
            <div className="hubx-access-item" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Newsletter — per the module inventory's own rule, "Footer module only.
 * Anywhere on the hub page" is rejected. This renders LAST, as a closing
 * band immediately before the shared site footer, never mixed in among the
 * content modules above. Copy is hub-name-driven rather than
 * league-specific wording, so this stays config+assets for hub two.
 */
export function HubNewsletter({ hub }: { hub: Hub }) {
  return (
    // Full-bleed, so like the board it opens its own .container rather than
    // sitting inside the page's.
    <section className="hubx-newsletter" aria-labelledby="hubx-newsletter-title">
      <div className="container hubx-newsletter-inner">
        <div>
          <p className="hubx-kicker">Playbook Newsletter</p>
          <h2 className="hubx-head" id="hubx-newsletter-title">No te pierdas lo que viene en {hub.name}</h2>
          <p className="hubx-sub" style={{ marginBottom: 0 }}>
            Sigue el negocio de {hub.name} sin perderte nada. Gratis en tu correo.
          </p>
        </div>
        <NewsletterForm
          placement="hub"
          formClassName="hubx-newsletter-form"
          action="https://playbookmedia.substack.com/"
          emailId={`nl-email-hub-${hub.slug}`}
          emailLabel="Tu correo"
          buttonLabel="Suscribirme"
          successMessage="Te abrimos Substack para confirmar."
        />
      </div>
    </section>
  );
}

/**
 * The anchor rail under the masthead.
 *
 * Built from the modules that WILL ACTUALLY RENDER, using the same
 * conditions the modules themselves use — every one of them is allowed to
 * hide (a chain with no target, a season under two beats, pillars a hub
 * chose not to declare), and a rail link to a section that hid itself is a
 * dead anchor. When the conditions here and the guard inside a module
 * disagree, the module wins and the rail is wrong; keep them in one place
 * by reading the same config fields.
 */
export function HubRail({ hub }: { hub: Hub }) {
  const links: Array<[string, string]> = [['lo-ultimo', 'Lo último']];
  if (hub.chain) links.push(['la-meta', 'La meta']);
  if (hub.commercialState.length) links.push(['tablero', 'El tablero']);
  if (hub.pillars?.length) links.push(['temas', 'Temas que seguimos']);
  if (hub.plazas.length) links.push(['plazas', 'Plazas']);
  if (hub.momentsClave && hub.momentsClave.length >= 2) links.push(['momentos', 'Momentos clave']);
  if (hub.season.length >= 2) links.push(['temporada', 'La temporada']);
  if (hub.access?.length) links.push(['adentro', 'Desde adentro']);
  // One link is not a navigation.
  if (links.length < 2) return null;
  return (
    <nav className="hubx-rail" aria-label={`Secciones de la cobertura ${hub.name}`}>
      <div className="container hubx-rail-inner">
        {links.map(([id, label]) => (
          <a href={`#${id}`} key={id}>{label}</a>
        ))}
      </div>
    </nav>
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

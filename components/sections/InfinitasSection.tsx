import type { InfinitasCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { AdSlot } from '@/components/ads/AdSlot';

// "El Marcador en portada" (2026-08-14 redesign, user directive: the old
// three-column dark-overlay photo grid read flatter than the rest of the
// homepage's editorial system, and its eyebrow dot was even green). The
// section now speaks the same language as the /infinitas hub after its
// same-day tint reduction: violet as ACCENT on the site's own paper — a
// thick top rule, the lowercase wordmark, a clean editorial split lead
// (photo with violet baseline, serif headline), and the side stories as a
// scoreboard-numbered ranking list, which is the product's thesis
// ("women's sports as a business force") expressed as layout. Data shape
// (featured + sideCards) and the CMS Infinitas tab are untouched.
// Classes are infsec-* — the old inf-* block in sections.css is gone, but
// the prefix stays distinct from the hub's infhub-* on purpose (the
// 2026-08-05 collision lesson).
function InfinitasSideRow({ card, index }: { card: InfinitasCard; index: number }) {
  return (
    <a className="infsec-row reveal" href={safeUrl(card.url)} target="_blank" rel="noopener noreferrer">
      <span className="infsec-num" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="infsec-row-copy">
        <span className="eyebrow">{card.eyebrow}</span>
        <h4>{card.title}</h4>
      </span>
      {card.image && (
        // Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="infsec-thumb" src={card.image} width={368} height={276} alt="" loading="lazy" decoding="async" />
      )}
    </a>
  );
}

export function InfinitasSection({ data }: { data: SiteContentData['infinitasSection'] }) {
  // When the CMS heading is just the brand name, the h2 IS the wordmark —
  // rendering a violet "infinitas" directly above an uppercase "INFINITAS"
  // read as a stutter (caught on the first screenshot pass). A custom
  // heading gets the small wordmark above it as the section brand.
  const headingIsBrand = data.heading.trim().toLowerCase() === 'infinitas';
  return (
    <section className="container infsec" id="infinitas">
      <div className="infsec-mast reveal">
        {!headingIsBrand && (
          <span className="infsec-wordmark" aria-hidden="true">
            infinitas
          </span>
        )}
        <div className="section-head infsec-head">
          <div>
            <h2 className={headingIsBrand ? 'infsec-heading-brand' : undefined}>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
          <a className="section-link" href={safeUrl(data.linkUrl)} target="_blank" rel="noopener noreferrer">
            {data.linkLabel}
          </a>
        </div>
      </div>

      <div className="infsec-grid">
        <a className="infsec-lead reveal" href={safeUrl(data.featured.url)} target="_blank" rel="noopener noreferrer">
          {data.featured.image && (
            <span className="infsec-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.featured.image} width={1200} height={675} alt="" loading="lazy" decoding="async" />
            </span>
          )}
          <span className="infsec-lead-copy">
            <span className="eyebrow">{data.featured.eyebrow}</span>
            <h3>{data.featured.title}</h3>
            {data.featured.body && <p>{data.featured.body}</p>}
            <span className="infsec-cta">Leer la historia →</span>
          </span>
        </a>

        <div className="infsec-rows">
          {data.sideCards.map((card, i) => (
            <InfinitasSideRow key={i} card={card} index={i} />
          ))}
        </div>
      </div>

      <AdSlot slot="vertical-sponsor-infinitas" />
    </section>
  );
}

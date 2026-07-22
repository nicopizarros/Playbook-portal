import type { InfinitasCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { AdSlot } from '@/components/ads/AdSlot';

// Fase 7 UX: upgraded from the old featured+stacked-side layout to the
// v24 prototype's inf-card three-column grid (1.3fr 1fr 1fr) — every card
// is a full-bleed photo with an absolute-positioned gradient overlay and
// the copy pinned to the bottom. Data shape (featured + sideCards) and
// the CMS Infinitas tab are untouched; the featured card simply takes the
// wider first column. The vertical-sponsor ad slot (named sponsorship,
// non-programmatic — see HANDOFF Fase 7) sits after the cards, inside the
// section it sponsors.
function InfCard({ card, heading }: { card: InfinitasCard; heading: 'h3' | 'h4' }) {
  const Heading = heading;
  return (
    <a className="inf-card reveal" href={safeUrl(card.url)} target="_blank" rel="noopener noreferrer">
      {/* Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="inf-bg" src={card.image} width={1200} height={750} alt="" loading="lazy" decoding="async" />
      <div className="inf-content">
        <span className="eyebrow">{card.eyebrow}</span>
        <Heading>{card.title}</Heading>
        {card.body && <p>{card.body}</p>}
      </div>
    </a>
  );
}

export function InfinitasSection({ data }: { data: SiteContentData['infinitasSection'] }) {
  return (
    <section className="container" id="infinitas" style={{ padding: '44px 24px' }}>
      <div className="section-head reveal" style={{ paddingTop: 0 }}>
        <div>
          <h2>{data.heading}</h2>
          <p className="sub">{data.sub}</p>
        </div>
        <a className="section-link" href={safeUrl(data.linkUrl)} target="_blank" rel="noopener noreferrer">
          {data.linkLabel}
        </a>
      </div>
      <div className="inf-grid">
        <InfCard card={data.featured} heading="h3" />
        {data.sideCards.map((card, i) => (
          <InfCard key={i} card={card} heading="h4" />
        ))}
      </div>
      <AdSlot slot="vertical-sponsor-infinitas" />
    </section>
  );
}

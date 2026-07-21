import type { InfinitasCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';

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
      <div className="infinitas-wrap">
        <InfCard card={data.featured} heading="h3" />
        <div className="inf-side">
          {data.sideCards.map((card, i) => (
            <InfCard key={i} card={card} heading="h4" />
          ))}
        </div>
      </div>
    </section>
  );
}

import type { OpinionCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';

function OpinionCardView({ card }: { card: OpinionCard }) {
  if (card.variant === 'banner') {
    return (
      <a className="opinion-card tfbr reveal" href={safeUrl(card.url)} target="_blank" rel="noopener noreferrer">
        {/* Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.image} width={900} height={160} alt={card.imageAlt || card.title} loading="lazy" decoding="async" />
        <div className="tfbr-copy">
          <h3>{card.title}</h3>
          <p>{card.excerpt}</p>
        </div>
      </a>
    );
  }
  return (
    <a className="opinion-card reveal" href={safeUrl(card.url)} target="_blank" rel="noopener noreferrer">
      <div className="masthead">{card.masthead}</div>
      <h3>{card.title}</h3>
      <p>{card.excerpt}</p>
    </a>
  );
}

export function OpinionSection({ data }: { data: SiteContentData['opinionSection'] }) {
  return (
    <section className="container" id="analisis">
      <div className="section-head reveal">
        <div>
          <h2>{data.heading}</h2>
        </div>
        <a className="section-link" href={safeUrl(data.archiveLinkUrl)} target="_blank" rel="noopener noreferrer">
          {data.archiveLinkLabel}
        </a>
      </div>
      <div className="opinion-grid">
        {data.cards.map((card, i) => (
          <OpinionCardView key={i} card={card} />
        ))}
      </div>
    </section>
  );
}

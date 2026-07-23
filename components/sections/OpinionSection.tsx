import type { OpinionCard, SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';

// Fase 7 UX: restyled to the v24 prototype's analysis-grid/analysis-card
// pattern (docs/playbook-portal-v24-medio-consulta(1).html) — cards share
// one ink border-top with no gaps between them, the first card carries a
// dark ink background with the eyebrow in brand green. Deliberately a
// different visual weight from the news feed: analysis reads as a block,
// not as more headlines. The old 'banner' variant (TFBR, image strip)
// folds into the same typographic card — its wordmark becomes the
// heading, keeping the grid strictly editorial. Data shape and the CMS
// Opinión tab are untouched.
function AnalysisCard({ card, featured }: { card: OpinionCard; featured: boolean }) {
  return (
    <a
      className={`analysis-card${featured ? ' featured' : ''} reveal`}
      href={safeUrl(card.url)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {card.masthead && <span className="eyebrow">{card.masthead}</span>}
      <h3>{card.title}</h3>
      <p>{card.excerpt}</p>
      <span className="read">Leer el análisis →</span>
    </a>
  );
}

export function OpinionSection({ data }: { data: SiteContentData['opinionSection'] }) {
  return (
    <section className="analysis-section" id="analisis">
      <div className="container">
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
          </div>
          <a className="section-link" href={safeUrl(data.archiveLinkUrl)} target="_blank" rel="noopener noreferrer">
            {data.archiveLinkLabel}
          </a>
        </div>
        <div className="analysis-grid">
          {data.cards.map((card, i) => (
            <AnalysisCard key={i} card={card} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

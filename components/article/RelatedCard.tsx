import type { Article } from '@/lib/data/articles';
import { hubForSource, extractPullFigure } from '@/lib/product-hubs';

// La Lectura's "Sigue leyendo" card (article redesign, 2026-08-05) —
// replaces the plain NewsRow list at the article foot. Each card previews
// its product's identity instead of reading as a generic link: the hub
// concept as the eyebrow ("El Expediente · La Lana del Deporte"), the
// story's biggest figure pulled out when it has one (same
// extractPullFigure the hubs use), and a source-colored top rule with a
// per-product hover skin (styles/lectura.css). Non-product sources
// (opinion) fall back to the publication name alone.
export function RelatedCard({ article }: { article: Article }) {
  const hub = hubForSource(article.source);
  const figure = extractPullFigure(article.title, article.excerpt);
  return (
    <a
      className="lect-related-card reveal"
      data-source={article.source}
      href={`/articulo?id=${encodeURIComponent(article.id)}`}
    >
      <span className="lect-related-eyebrow">
        {hub ? `${hub.concept} · ${article.publication}` : article.publication}
      </span>
      {figure && <span className="lect-related-figure">{figure}</span>}
      <h3>{article.title}</h3>
      <span className="lect-related-meta">
        {article.dateFormatted} · {article.readingTime || 1} min
        <span className="lect-related-arrow" aria-hidden="true">
          →
        </span>
      </span>
    </a>
  );
}

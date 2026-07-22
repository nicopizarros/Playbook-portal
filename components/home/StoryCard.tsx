import type { Article } from '@/lib/data/articles';

// Feed card for the homepage's two-column news layout (Fase 7 UX), drawn
// from the v23 prototype's story-card/story-visual vocabulary
// (docs/playbook-portal-v23-medio-consulta.html). Two visual states:
//
// - With a photo: 16/9 image on top, copy below.
// - Without one: the typography becomes the image — a colored editorial
//   background (source-mapped, same mapping idea as the v23 visual-label
//   pattern) with the headline set large in Anton. The heading renders
//   INSIDE the visual in that case (not duplicated below it): one <h3> per
//   card either way, just placed differently.
//
// Colors are fixed surfaces (--ink-fixed text on --green/--yellow, white
// on ink) so the poster look doesn't invert in dark mode — same criterion
// as .btn.accent / the video section (see styles/tokens.css).
//
// Each source maps to a palette, not a single color: its brand surface
// (green for industry-shots, yellow for la-lana, ink for infinitas)
// leads, but neutral surfaces rotate in. With this corpus, 17 of 22
// industry-shots articles have no image — a strict one-color-per-source
// rule painted the entire feed green (verified on a real render), which
// reads as wallpaper, not editorial punctuation. The rotation is keyed
// off a stable hash of the article id so a card keeps its surface across
// filters and reloads; only articles from a source can ever show that
// source's brand color, so the mapping stays legible.
const SOURCE_PALETTE: Record<string, string[]> = {
  'industry-shots': ['visual-green', 'visual-grid', 'visual-black'],
  'la-lana': ['visual-yellow', 'visual-grid', 'visual-black'],
  infinitas: ['visual-black', 'visual-grid'],
};
const DEFAULT_PALETTE = ['visual-grid', 'visual-black'];

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function StoryCard({ article }: { article: Article }) {
  const href = `/articulo?id=${encodeURIComponent(article.id)}`;
  const palette = SOURCE_PALETTE[article.source] || DEFAULT_PALETTE;
  const visualClass = palette[hashId(article.id) % palette.length];

  return (
    <a className="story-card reveal" data-source={article.source} href={href}>
      {article.imageUrl ? (
        <>
          <div className="story-visual photo">
            {/* Editor-supplied URL, arbitrary host -- see AboutSection.tsx's comment. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.imageUrl} width={640} height={360} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="story-copy">
            <span className={`tag-mini ${article.source}`}>{article.publication}</span>
            <h3>{article.title}</h3>
            <div className="byline">
              {article.dateFormatted} · {article.readingTime || 1} min
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={`story-visual ${visualClass}`}>
            <h3 className="visual-label">{article.title}</h3>
          </div>
          <div className="story-copy">
            <span className={`tag-mini ${article.source}`}>{article.publication}</span>
            {article.excerpt && <p>{article.excerpt}</p>}
            <div className="byline">
              {article.dateFormatted} · {article.readingTime || 1} min
            </div>
          </div>
        </>
      )}
    </a>
  );
}

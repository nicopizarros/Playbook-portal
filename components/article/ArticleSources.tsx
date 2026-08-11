import type { ArticleSource } from '@/lib/article-sources';

// The foot-of-article source credit. Deliberately the quietest element on
// the page: a hairline, a label at caption size, and the outlet names in a
// single run. The first source carries the "origen" mark — the outlet that
// broke the story gets named as such, and everything after it is corroboration.
//
// Rendered outside .article-body (see app/(public)/articulo/page.tsx): the
// end-of-article mark is a ::after on the body's last paragraph, and credit
// that sits before that mark would read as one more paragraph of the piece.
export function ArticleSources({ sources }: { sources: ArticleSource[] }) {
  if (!sources.length) return null;

  return (
    <aside className="lect-sources" aria-label="Fuentes">
      <span className="lect-sources-label">Fuentes</span>
      <ul className="lect-sources-list">
        {sources.map((source, i) => (
          <li key={source.href} className="lect-source">
            <a
              href={source.href}
              title={source.detail || undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.name}
            </a>
            {i === 0 && <span className="lect-source-origin">origen</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}

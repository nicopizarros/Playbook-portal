'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { articlePath } from '@/lib/article-url';

// Only what the dropdown renders. `excerpt` is still SEARCHED — the match
// runs in app/api/search/route.ts, which sees the full row — but it is no
// longer sent to the browser, because nothing here ever displayed it.
export type SearchableArticle = {
  id: string;
  title: string;
  publication: string;
  source: string;
};

// The Spanish-aware matching (Fase 7: lowercase + strip combining
// diacritics, so "futbol" finds "fútbol" and "Mexico" finds "México") moved
// to the API route along with the corpus. It is carried over verbatim there
// rather than reimplemented as SQL: Postgres ILIKE is accent-sensitive
// without the unaccent extension, which would have silently broken exactly
// that behaviour.
//
// Why the corpus moved at all: this component used to take every article's
// id/title/excerpt/publication/source as a prop, and because it lives in
// the header it was serialized into every page's RSC payload — all ~211
// excerpts on all 243 URLs, whether or not the reader ever typed anything.
const DEBOUNCE_MS = 180;

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchableArticle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced so a fast typist fires one request, not one per keystroke.
  // AbortController is what keeps results honest: without it a slow response
  // for "liv" can land after a fast one for "liv golf" and repaint the
  // dropdown with stale rows.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(r => (r.ok ? r.json() : { results: [] }))
        .then(data => setResults(Array.isArray(data.results) ? data.results : []))
        // An aborted request is the normal path on every keystroke, and a
        // failed one should leave the box empty rather than throwing into
        // an unhandled rejection.
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Was a hard display:none/block toggle with no transition at all — this
  // was the one interactive surface in the header with zero motion on
  // open/close. autoAlpha (opacity + visibility together) keeps it out of
  // the tab order and unclickable while closed, same as display:none did.
  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { autoAlpha: isOpen ? 1 : 0, y: 0 });
      return;
    }
    gsap.to(el, {
      autoAlpha: isOpen ? 1 : 0,
      y: isOpen ? 0 : -6,
      duration: 0.2,
      ease: isOpen ? 'power2.out' : 'power2.in',
    });
  }, [isOpen]);

  const trimmed = query.trim();

  return (
    <div className="nav-search" ref={wrapRef}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="search"
        placeholder="Buscar"
        aria-label="Buscar en Playbook"
        autoComplete="off"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(e.target.value.trim() !== '');
        }}
        onFocus={() => { if (trimmed) setIsOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setIsOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <div className="search-results" ref={resultsRef} id="search-results" role="listbox" aria-label="Resultados de búsqueda">
        {trimmed && results.length === 0 && (
          <p className="sr-empty">Sin resultados para &quot;{trimmed}&quot;</p>
        )}
        {results.map(a => (
          <a key={a.id} className="sr-item" href={articlePath(a.id)}>
            <span className={`tag-mini ${a.source}`}>{a.publication}</span>
            <h4>{a.title}</h4>
          </a>
        ))}
      </div>
    </div>
  );
}

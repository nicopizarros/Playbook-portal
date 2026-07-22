'use client';

import { useEffect, useRef, useState } from 'react';

export type SearchableArticle = {
  id: string;
  title: string;
  excerpt: string;
  publication: string;
  source: string;
};

// Spanish-aware matching (Fase 7): lowercase + strip combining diacritics
// (NFD splits "ú" into "u" + U+0301, the replace drops the accent mark) on
// BOTH sides of the comparison, so "futbol" finds "fútbol" and "Mexico"
// finds "México" — previously the search was accent-sensitive and quietly
// missed most Spanish content unless the reader typed exact accents.
function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matches(article: SearchableArticle, query: string) {
  const q = normalize(query);
  return (
    normalize(article.title).includes(q) ||
    normalize(article.excerpt).includes(q) ||
    normalize(article.publication).includes(q)
  );
}

export function SearchBox({ articles }: { articles: SearchableArticle[] }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const trimmed = query.trim();
  const results = trimmed ? articles.filter(a => matches(a, trimmed)).slice(0, 8) : [];

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
      <div className={`search-results${isOpen ? ' is-open' : ''}`} id="search-results" role="listbox" aria-label="Resultados de búsqueda">
        {trimmed && results.length === 0 && (
          <p className="sr-empty">Sin resultados para &quot;{trimmed}&quot;</p>
        )}
        {results.map(a => (
          <a key={a.id} className="sr-item" href={`/articulo?id=${encodeURIComponent(a.id)}`}>
            <span className={`tag-mini ${a.source}`}>{a.publication}</span>
            <h4>{a.title}</h4>
          </a>
        ))}
      </div>
    </div>
  );
}

import type { Article } from '@/lib/data/articles';
import type { ArticleInput } from '@/lib/actions/admin';

// The Articles tab's local edit model. One row per article, unlike
// legacy's single articles.json array save — see HANDOFF.md's "per-article
// save vs. legacy's whole-file save" note. `clientKey` is a stable React
// key independent of the editable `id` field (a brand-new row starts with
// a blank id, auto-filled from the title, same as legacy).
export type ArticleEntry = {
  clientKey: string;
  inBaseline: boolean;
  baselineUpdatedAt: string | null;
  baselineData: (ArticleInput & { id: string; status: 'published' | 'draft' }) | null;
  data: ArticleInput & { id: string; status: 'published' | 'draft' };
};

function toData(a: Article) {
  return {
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    teaser: a.teaser,
    wallTeaser: a.wallTeaser ?? '',
    bodyJson: a.bodyJson ?? null,
    author: a.author,
    date: a.date,
    dateFormatted: a.dateFormatted,
    publication: a.publication,
    source: a.source,
    tagsScope: a.tagsScope,
    tagsSport: a.tagsSport,
    tagsVertical: a.tagsVertical,
    priority: a.priority,
    featured: a.featured,
    mostrarAutor: a.mostrarAutor,
    readingTime: a.readingTime,
    substackUrl: a.substackUrl,
    imageUrl: a.imageUrl,
    imageCredit: a.imageCredit ?? '',
    status: a.status,
  };
}

export function articleToEntry(a: Article): ArticleEntry {
  const data = toData(a);
  return {
    clientKey: a.id,
    inBaseline: true,
    baselineUpdatedAt: a.updatedAt.toISOString(),
    baselineData: data,
    data,
  };
}

// Reuses an existing entry's stable clientKey after a successful
// create/save — clientKey must never change once assigned (React key +
// what the save handler uses to match outcomes back to entries), even
// though createArticle can return a different `id` than what was typed
// (short-suffix fallback on a slug collision).
export function applyServerArticle(clientKey: string, a: Article): ArticleEntry {
  const data = toData(a);
  return {
    clientKey,
    inBaseline: true,
    baselineUpdatedAt: a.updatedAt.toISOString(),
    baselineData: data,
    data,
  };
}

export function newArticleEntry(): ArticleEntry {
  return {
    clientKey: `new-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
    inBaseline: false,
    baselineUpdatedAt: null,
    baselineData: null,
    data: {
      id: '',
      title: '',
      excerpt: '',
      teaser: '',
      wallTeaser: '',
      bodyJson: null,
      author: '',
      date: '',
      dateFormatted: '',
      publication: 'Playbook',
      source: 'playbook',
      tagsScope: [],
      tagsSport: [],
      tagsVertical: [],
      priority: 3,
      featured: false,
      mostrarAutor: false,
      readingTime: 1,
      substackUrl: '',
      imageUrl: '',
      imageCredit: '',
      status: 'published',
    },
  };
}

export function isEntryDirty(entry: ArticleEntry): boolean {
  return !entry.inBaseline || JSON.stringify(entry.data) !== JSON.stringify(entry.baselineData);
}

// The live preview panel feeds NewsGrid/LeadStory/NewsRow/Ticker with
// locally-edited state instead of a DB fetch — those components only ever
// read the fields ArticleEntry already tracks, so the DB-only columns
// (bodyHtml/sourceUrl/createdAt/updatedAt/updatedBy) are filled with inert
// placeholders purely to satisfy the shared Article type, never rendered.
export function toPreviewArticle(data: ArticleEntry['data']): Article {
  return {
    ...data,
    bodyHtml: null,
    sourceUrl: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    updatedBy: null,
  };
}

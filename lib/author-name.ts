// The `articles.author` column is an editor-authored DISPLAY string, not a
// clean name. Two shapes exist in the real table today:
//
//   "Guillermo Mejía"
//   "[Rodrigo Dosal](https://www.instagram.com/rodrigo_dosal/), fundador de
//    [DOME Sport](https://www.domesport.org/)"
//
// The second shape is deliberate — guest collaborations need per-name
// external links, which one internal byline link cannot express (see
// renderAuthorByline in the article page). But the raw string was also being
// used verbatim as a URL parameter, a <title>, an <h1> and a JSON-LD name.
//
// The result was live in production on 2026-09-02: the sitemap carried
//   /autor?nombre=%5BRodrigo%20Dosal%5D(https%3A%2F%2F...)%2C%20fundador...
// and that page rendered
//   <title>[Rodrigo Dosal](https://www.instagram.com/...), fundador de
//          [DOME Sport](https://www.domesport.org/) — Playbook</title>
// with `robots: index, follow`. Unrendered markdown, indexable, and — because
// exactly one article in the table has mostrarAutor = true — it was the ONLY
// author page the site generated at all.
//
// Everything that turns an author into a URL, a title or a schema name must
// go through here. Rendering the byline itself does NOT: that still wants the
// markdown, so the links survive.

const MARKDOWN_LINK = /\[(.+?)\]\((\S+?)\)/g;

// "[Rodrigo Dosal](https://…), fundador de [DOME Sport](https://…)"
//   -> "Rodrigo Dosal, fundador de DOME Sport"
export function authorDisplayName(author: string | null | undefined): string {
  return String(author || '')
    .replace(MARKDOWN_LINK, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Guard for the indexability decision on /autor. Stripping markdown fixes the
// known bad value, but the column is free text an editor can put anything in,
// and an author page is not worth indexing if its name still looks like
// machine output rather than a person or a person-plus-affiliation.
const MAX_INDEXABLE_LENGTH = 80;

export function isIndexableAuthorName(name: string): boolean {
  if (!name || name.length > MAX_INDEXABLE_LENGTH) return false;
  // Any surviving URL, markdown bracket or newline means the value was not a
  // name to begin with — index nothing rather than guess at it.
  if (/https?:\/\/|[[\]()<>{}|]|[\r\n]/.test(name)) return false;
  // Must contain at least one letter; a string of punctuation or digits is
  // not an author.
  return /\p{L}/u.test(name);
}

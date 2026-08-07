import { NewsletterForm } from '@/components/shared/NewsletterForm';
import { DailyFigure } from './DailyFigure';
import { AdSlot } from '@/components/ads/AdSlot';
import { getAllArticles, getArticleById } from '@/lib/data/articles';
import { rankArticles, selectHero } from '@/lib/rank';
import { extractPullFigure, extractCifraFromBody } from '@/lib/product-hubs';

// Right rail of the homepage news package (Fase 7 UX). Server component:
// MostReadSection needs GA4 data access. Rendered by
// app/(public)/page.tsx and passed INTO the client-side NewsGrid as a
// ReactNode prop — the sidebar never re-renders when the reader changes
// source filters, only the stories do.
//
// Modules, top to bottom:
// - compact newsletter module (from the Fase 9 plan's sidebar spec) —
//   a conversion point the sales side asked to keep close to the top of
//   the page. Moved above Más leídas 2026-08-01 (Roadmap Agosto 2026,
//   Fase 1, item 4: "reubicar Más leídas debajo del bloque de
//   suscripción") -- was the first module in the rail before that.
//   Stays FIRST — the sales position is negotiated; new modules go below.
// - La cifra del día (La Portada round 2, 2026-08-05): the biggest figure
//   among today's ranked stories, counting up, linking to its story. Zero
//   CMS work — derived from the same ranked pool the news package uses
//   (React-cached, no extra query) with the same extractPullFigure the
//   hub heroes use. Skips the hero story so the rail adds information
//   instead of repeating the headline sitting next to it; collapses to
//   nothing on days when no ranked story carries a figure.
// - rail-home ad. Más leídas moved OUT of the rail (2026-08-06, user
//   feedback from an iPad: the rail stretched far past the 1+5 columns
//   and left a page-tall hole) — it's now the full-width band under the
//   news package (see app/(public)/page.tsx), and the ad closes the rail.
export async function HomeSidebar() {
  const articles = await getAllArticles();
  const ranked = rankArticles(articles.filter(a => a.source !== 'opinion' || a.featured));
  const hero = selectHero(ranked);
  let cifra: { figure: string; caption?: string; id: string; title: string } | null = null;
  for (const article of ranked) {
    if (article === hero) continue;
    const figure = extractPullFigure(article.title, article.excerpt);
    if (figure) {
      cifra = { figure, id: article.id, title: article.title };
      break;
    }
  }
  // A declared "Cifra clave:" in the chosen story's body always beats the
  // scraped title/excerpt figure — the scrape can land on a CONTEXT number
  // (calibration, 2026-08-05: the LIV Golf story led its excerpt with the
  // PIF's historical 6,000 millones while the story's actual figure, the
  // rumored US$250M, was the declared beat). One bounded by-id fetch for
  // the single chosen article, React-cached like every other lookup.
  if (cifra) {
    const full = await getArticleById(cifra.id);
    const declared = full && extractCifraFromBody(full.bodyHtml, full.teaser);
    if (declared) {
      cifra.figure = declared.value;
      // The declared beat's caption is what the figure MEANS, and the rail
      // used to drop it: "US$8,000 a US$20,000" over a headline about talent
      // factories left the reader with a number and no unit (user feedback,
      // 2026-08-07). The article page has always shown it under the
      // pull-figure; the sidebar now shows the same line, so the two
      // surfaces explain the number identically. Only a DECLARED Cifra clave
      // carries one — a figure scraped out of title/excerpt has no caption
      // to show, and the story headline underneath stays the only context,
      // same as before.
      cifra.caption = declared.caption || undefined;
    }
  }

  return (
    <div className="sidebar-sticky">
      <section className="side-module side-newsletter" aria-labelledby="side-nl-title">
        <h2 className="side-title" id="side-nl-title">Newsletter</h2>
        <p className="side-newsletter-copy">
          Lo que mueve al negocio del deporte, directo a tu correo.
        </p>
        <NewsletterForm
          formClassName="side-newsletter-form"
          action="https://playbookmedia.substack.com/"
          emailId="nl-email-side"
          emailLabel="Tu correo"
          buttonLabel="Suscribirme"
          successMessage="Te abrimos Substack para confirmar."
        />
      </section>
      {cifra && (
        <section className="side-module side-cifra" aria-labelledby="side-cifra-title">
          <h2 className="side-title" id="side-cifra-title">La cifra del día</h2>
          <a className="side-cifra-card" href={`/articulo?id=${encodeURIComponent(cifra.id)}`}>
            <DailyFigure figure={cifra.figure} />
            {cifra.caption && <span className="side-cifra-caption">{cifra.caption}</span>}
            <span className="side-cifra-story">{cifra.title}</span>
            <span className="side-cifra-cta" aria-hidden="true">Leer la historia →</span>
          </a>
        </section>
      )}
      <AdSlot slot="rail-home" />
    </div>
  );
}

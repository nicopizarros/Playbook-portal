import { MostReadSection } from './MostReadSection';
import { NewsletterForm } from '@/components/shared/NewsletterForm';
import { AdSlot } from '@/components/ads/AdSlot';

// Right rail of the homepage news package (Fase 7 UX). Server component:
// MostReadSection needs GA4 data access. Rendered by
// app/(public)/page.tsx and passed INTO the client-side NewsGrid as a
// ReactNode prop — the sidebar never re-renders when the reader changes
// source filters, only the stories do.
//
// Three modules, top to bottom:
// - compact newsletter module (from the Fase 9 plan's sidebar spec) —
//   a conversion point the sales side asked to keep close to the top of
//   the page. Moved above Más leídas 2026-08-01 (Roadmap Agosto 2026,
//   Fase 1, item 4: "reubicar Más leídas debajo del bloque de
//   suscripción") -- was the first module in the rail before that.
// - Más leídas (GA4-backed; renders nothing until credentials exist —
//   available:false degradation, see lib/most-read.ts)
// - rail-home ad, directly below Más leídas (the Fase 7 spec position;
//   now that the slot shows a visible placeholder it sits here rather
//   than at the bottom) — kept paired with Más leídas rather than left
//   behind at the old top-of-rail spot, since nothing in the Fase 1
//   request said to move the ad specifically.
export function HomeSidebar() {
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
      <MostReadSection />
      <AdSlot slot="rail-home" />
    </div>
  );
}

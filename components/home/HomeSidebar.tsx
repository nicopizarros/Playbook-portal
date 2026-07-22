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
// - Más leídas (GA4-backed; renders nothing until credentials exist —
//   available:false degradation, see lib/most-read.ts)
// - rail-home ad reservation
// - compact newsletter module (from the Fase 9 plan's sidebar spec) —
//   real content that keeps the rail earning its column while GA4/ads
//   are pending, and a conversion point the sales side asked to keep
//   close to the top of the page.
export function HomeSidebar() {
  return (
    <div className="sidebar-sticky">
      <MostReadSection />
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
          successMessage="¡Listo! Revisa tu correo."
        />
      </section>
      <AdSlot slot="rail-home" />
    </div>
  );
}

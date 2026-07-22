import type { SiteContentData } from '@/lib/data/site-content';

// Fase 7 UX: compressed — no section heading (the content reads itself),
// tighter padding, rendered directly below the stats strip inside the
// homepage's single proof band (see app/(public)/page.tsx). The CMS
// Testimonios tab still edits the same data; only the chrome around it
// shrank.
export function TestimonialsSection({ data }: { data: SiteContentData['testimonialsSection'] }) {
  return (
    <section className="container testimonials-band">
      <div className="testimonial-grid">
        {data.testimonials.map((t, i) => (
          <div className="quote reveal" key={i}>
            <p>&quot;{t.quote}&quot;</p>
            <div className="attribution">
              <span className="avatar" aria-hidden="true"></span>
              <div>
                <b>{t.name}</b>
                <span>{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

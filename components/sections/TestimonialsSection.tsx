import type { SiteContentData } from '@/lib/data/site-content';

export function TestimonialsSection({ data }: { data: SiteContentData['testimonialsSection'] }) {
  return (
    <section className="container" style={{ padding: '44px 24px' }}>
      <div className="section-head reveal" style={{ paddingTop: 0 }}>
        <div>
          <h2>{data.heading}</h2>
        </div>
      </div>
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

import type { SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';

export function AboutSection({ data }: { data: SiteContentData['aboutSection'] }) {
  return (
    <section className="container" id="acerca">
      <div className="about-card">
        <a
          className="about-visual reveal"
          href={safeUrl(data.videoUrl)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver Al Banquillo en YouTube"
        >
          {/* Plain <img>, not next/image, deliberately: data.image is an
              editor-supplied URL from site_content, not a fixed set of
              known hosts -- next/image would need next.config.ts's
              images.remotePatterns to allow-list every possible domain
              (or `unoptimized`, which gives up its main benefit), and
              would hard-error at runtime for any host not already listed.
              Same reasoning applies to every other editorial-image <img>
              in this repo (LeadStory, articulo/page.tsx, Infinitas/
              Opinion/ProductsSection, VideoSection's clip thumbnail) --
              see next.config.ts's CSP comment for the confirmed real
              source domains (Unsplash, ESPN, Goal.com, arbitrary news
              outlets via the Make.com webhook). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.image} width={1280} height={720} alt={data.imageAlt} loading="lazy" decoding="async" />
          <div className="about-visual-badge">
            <span>{data.badgeEyebrow}</span>
            <strong>{data.badgeTitle}</strong>
          </div>
        </a>
        <div className="about-copy reveal">
          <span className="eyebrow">{data.eyebrow}</span>
          <p className="pull">
            {data.pullQuoteMain}
            <span className="punct">.</span> <em>{data.pullQuoteEm}<span className="punct">.</span></em>
          </p>
          <p>{data.body}</p>
          <div className="products-line">
            {data.productsLine} <span>{data.productsLineNote}</span>
          </div>
          <div className="about-actions">
            {data.actions.map((a, i) => (
              <a key={i} className={`btn ${a.style}`} href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

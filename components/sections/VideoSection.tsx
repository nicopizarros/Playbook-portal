import type { SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { LazyEmbed } from '@/components/LazyEmbed';

// Fase 7 UX (second pass, after user feedback): the section is the
// two-video feature block + episode list, closed by a slim channel CTA
// strip. The old four-thumbnail YouTube clip grid diluted the section and
// the Instagram replacements (first embeds, then link-out tiles) are both
// gone — embeds had the blank-gap failure mode, and the tile version was
// scrapped by the user. The CTA strip reuses the channel link the CMS
// video tab already edits (channelLinkUrl/channelLinkLabel), so the freed
// space ends in a conversion point instead of dead air. The `clips` and
// `instagramReels` CMS fields remain editable and stored; the homepage
// just doesn't render them.
export function VideoSection({ data }: { data: SiteContentData['videoSection'] }) {
  return (
    <section className="video-section" id="video">
      <div className="container" style={{ padding: '0 24px 46px' }}>
        {/* No .section-link here, unlike every other section head.
            channelLinkLabel/channelLinkUrl used to render twice on this
            one page — once as a quiet text link in this head, and again
            360px lower as the .video-cta strip's button — same label ("Ir
            al canal"), same href, nothing to distinguish them. Reported as
            reading redundant, and it is: the CTA strip exists precisely to
            be the section's single conversion point (see this component's
            note above), so the duplicate here is the one to drop. The CMS
            fields are untouched — the Video tab still edits one channel
            link, it now just renders in one place. */}
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
        </div>

        <div className="video-grid">
          <div className="video-top">
            <div className="video-feature-card reveal">
              <div className="frame">
                <LazyEmbed>
                  <iframe
                    src={`https://www.youtube.com/embed/${data.featured.embedId}`}
                    title={data.featured.embedTitle}
                    loading="lazy"
                    allowFullScreen
                  />
                </LazyEmbed>
              </div>
              <h3 className="video-card-title">{data.featured.title}</h3>
            </div>
            <div className="video-feature-copy reveal">
              <div className="frame">
                <LazyEmbed>
                  <iframe
                    src={`https://www.youtube.com/embed/${data.secondary.embedId}`}
                    title={data.secondary.embedTitle}
                    loading="lazy"
                    allowFullScreen
                  />
                </LazyEmbed>
              </div>
              <h3 className="video-card-title">{data.secondary.title}</h3>
              <div className="more-eps">
                {data.secondary.episodeLinks.map((ep, i) => (
                  <a key={i} href={safeUrl(ep.url)} target="_blank" rel="noopener noreferrer">
                    {ep.label} <span>Ver video</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="video-cta reveal">
            <p>Análisis, entrevistas y series originales cada semana.</p>
            <a className="btn light on-dark" href={safeUrl(data.channelLinkUrl)} target="_blank" rel="noopener noreferrer">
              {data.channelLinkLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

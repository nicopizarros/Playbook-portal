import type { SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { LazyEmbed } from '@/components/LazyEmbed';
import { InstagramGrid } from './InstagramGrid';

// Fase 7 UX trim: the section keeps its two-video feature block + episode
// list and gains the InstagramGrid tiles; the old four-thumbnail YouTube
// clip grid (clips-row/ClipCard) and the Instagram embed widgets
// (InstagramReels + embed.js) are gone from the homepage. The CMS video
// tab still edits the `clips` data — it keeps feeding the admin preview
// and stays available if a future surface wants it — but the homepage no
// longer renders it (decided in the Fase 7 homepage brief: the clip grid
// diluted the section and the embeds caused the blank-gap failure).
export function VideoSection({
  data,
  instagramProfileUrl = 'https://www.instagram.com/playbook.la/',
}: {
  data: SiteContentData['videoSection'];
  instagramProfileUrl?: string;
}) {
  const handleMatch = instagramProfileUrl.match(/instagram\.com\/([^/?#]+)/i);
  const instagramHandle = handleMatch ? `@${handleMatch[1]}` : 'Instagram';

  return (
    <section className="video-section" id="video">
      <div className="container" style={{ padding: '0 24px 46px' }}>
        <div className="section-head reveal">
          <div>
            <h2>{data.heading}</h2>
            <p className="sub">{data.sub}</p>
          </div>
          <a className="section-link" href={safeUrl(data.channelLinkUrl)} target="_blank" rel="noopener noreferrer">
            {data.channelLinkLabel}
          </a>
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

          <InstagramGrid
            reels={data.instagramReels}
            profileUrl={instagramProfileUrl}
            handle={instagramHandle}
          />
        </div>
      </div>
    </section>
  );
}

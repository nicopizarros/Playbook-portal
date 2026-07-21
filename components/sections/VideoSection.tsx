import type { SiteContentData, VideoClip } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { InstagramReels } from './InstagramReels';

function ClipCard({ clip }: { clip: VideoClip }) {
  if (clip.platform === 'instagram') {
    return (
      <a className="clip-card reveal" href={safeUrl(clip.url)} target="_blank" rel="noopener noreferrer">
        <div className={`frame ig-visual${clip.variant ? ` ${clip.variant}` : ''}`}>
          <div className="ig-phone">
            {clip.handle}
            <br />
            <br />
            {clip.igText}
          </div>
          <span className="platform-badge">Instagram</span>
          <div className="clip-copy">
            <span>{clip.handle}</span>
            <h4>{clip.title}</h4>
          </div>
        </div>
      </a>
    );
  }
  return (
    <a className="clip-card reveal" href={safeUrl(clip.url)} target="_blank" rel="noopener noreferrer">
      <div className="frame">
        <img src={clip.thumbnail} width={480} height={360} alt={clip.title} loading="lazy" decoding="async" />
        <span className="platform-badge">YouTube</span>
        <div className="play-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="#fff">
            <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.35)" />
            <path d="M10 8l6 4-6 4V8z" fill="#fff" />
          </svg>
        </div>
        <div className="clip-copy">
          <span>{clip.handle}</span>
          <h4>{clip.title}</h4>
        </div>
      </div>
    </a>
  );
}

export function VideoSection({ data }: { data: SiteContentData['videoSection'] }) {
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
                <iframe
                  src={`https://www.youtube.com/embed/${data.featured.embedId}`}
                  title={data.featured.embedTitle}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <h3 className="video-card-title">{data.featured.title}</h3>
            </div>
            <div className="video-feature-copy reveal">
              <div className="frame">
                <iframe
                  src={`https://www.youtube.com/embed/${data.secondary.embedId}`}
                  title={data.secondary.embedTitle}
                  loading="lazy"
                  allowFullScreen
                />
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

          <div className="clips-row">
            {data.clips.map((clip, i) => (
              <ClipCard key={i} clip={clip} />
            ))}
          </div>

          <InstagramReels reels={data.instagramReels} />
        </div>
      </div>
    </section>
  );
}

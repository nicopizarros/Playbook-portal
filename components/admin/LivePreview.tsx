'use client';

import { useEffect } from 'react';
import type { SiteContentData } from '@/lib/data/site-content';
import { NewsGrid } from '@/components/home/NewsGrid';
import { OpinionSection } from '@/components/sections/OpinionSection';
import { ProductsSection } from '@/components/sections/ProductsSection';
import { MidCta } from '@/components/sections/MidCta';
import { VideoSection } from '@/components/sections/VideoSection';
import { InfinitasSection } from '@/components/sections/InfinitasSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { safeUrl } from '@/lib/safe-url';
import { type ArticleEntry, isEntryDirty, toPreviewArticle } from './article-entry';

type Props = {
  content: SiteContentData;
  contentBaseline: SiteContentData;
  articleEntries: ArticleEntry[];
};

function PreviewSection({
  dataKey,
  changed,
  children,
}: {
  dataKey: string;
  changed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`preview-section${changed ? ' is-changed' : ''}`} data-key={dataKey}>
      <span className="preview-section-tag">● Cambios sin guardar</span>
      {children}
    </div>
  );
}

// Legacy renders these two blocks with plain HTML-string templates
// (navLinksTemplate/footerContentTemplate) fed by local state — the same
// idea here, since the real <Header>/<Footer> are async Server Components
// that fetch their own data and can't be dropped into a client-rendered
// preview tree. Simplified stand-ins, not the real chrome (per HANDOFF.md's
// Fase 4 plan).
function PreviewHeader({ nav }: { nav: SiteContentData['nav'] }) {
  return (
    <header className="topbar">
      <div className="container nav">
        <a className="brand" href="#" onClick={e => e.preventDefault()}>
          <img src="/assets/img/playbook-logo.webp" width={120} height={28} alt="Playbook" />
        </a>
        <nav className="nav-links">
          {nav.links.map((link, i) => (
            <a key={i} href={safeUrl(link.href)} onClick={e => e.preventDefault()}>{link.label}</a>
          ))}
        </nav>
        <a className="btn accent" href={safeUrl(nav.ctaUrl)} onClick={e => e.preventDefault()}>{nav.ctaLabel}</a>
      </div>
    </header>
  );
}

function PreviewFooter({ footer }: { footer: SiteContentData['footer'] }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/assets/img/playbook-logo-dark.png" width={180} height={44} alt="Playbook" />
          <p>{footer.brandBlurb}</p>
        </div>
        <div className="social-row">
          {footer.socialLinks.map((s, i) => (
            <a key={i} className="pill" href={safeUrl(s.url)} onClick={e => e.preventDefault()}>{s.label}</a>
          ))}
        </div>
      </div>
      <div className="container footer-copyright">
        <span>{footer.copyrightText}</span>
        <a href={safeUrl(footer.infinitasLinkUrl)} onClick={e => e.preventDefault()}>{footer.infinitasLinkLabel}</a>
      </div>
    </footer>
  );
}

export function LivePreview({ content, contentBaseline, articleEntries }: Props) {
  const previewArticles = articleEntries.map(e => toPreviewArticle(e.data));
  const articlesChanged = articleEntries.some(isEntryDirty);

  function changed<K extends keyof SiteContentData>(key: K) {
    return JSON.stringify(content[key]) !== JSON.stringify(contentBaseline[key]);
  }

  useEffect(() => {
    // legacy's revealPreviewCards(): the live site's .reveal cards start at
    // opacity:0 until a scroll-triggered IntersectionObserver adds
    // .is-visible (js/ui.js) — the preview never runs that observer, so
    // without this every opinion/product/stat/testimonial/clip card would
    // sit invisible forever.
    const root = document.querySelector('.admin-preview-body');
    root?.querySelectorAll('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
  });

  return (
    <div className="admin-preview-page">
      <PreviewSection dataKey="nav" changed={changed('nav')}>
        <PreviewHeader nav={content.nav} />
        <div className="ticker">
          <div className="ticker-label">
            <span className="dot" aria-hidden="true" />
            Playbook hoy
          </div>
          <div className="ticker-track">
            <div className="ticker-content">
              {previewArticles.slice(0, 6).map(a => (
                <span className="ticker-item" key={a.id}>{a.title}</span>
              ))}
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection dataKey="articles" changed={articlesChanged}>
        <main className="container news-section">
          <div className="section-head">
            <h2>Último en Playbook</h2>
          </div>
          <NewsGrid articles={previewArticles} />
        </main>
      </PreviewSection>

      <PreviewSection dataKey="opinionSection" changed={changed('opinionSection')}>
        <OpinionSection data={content.opinionSection} />
      </PreviewSection>

      <PreviewSection dataKey="productsSection" changed={changed('productsSection')}>
        <ProductsSection data={content.productsSection} />
      </PreviewSection>

      <PreviewSection dataKey="midCta" changed={changed('midCta')}>
        <MidCta data={content.midCta} />
      </PreviewSection>

      <PreviewSection dataKey="videoSection" changed={changed('videoSection')}>
        <VideoSection data={content.videoSection} />
      </PreviewSection>

      <PreviewSection dataKey="infinitasSection" changed={changed('infinitasSection')}>
        <InfinitasSection data={content.infinitasSection} />
      </PreviewSection>

      <PreviewSection dataKey="statsSection" changed={changed('statsSection')}>
        <StatsSection data={content.statsSection} />
      </PreviewSection>

      <PreviewSection dataKey="testimonialsSection" changed={changed('testimonialsSection')}>
        <TestimonialsSection data={content.testimonialsSection} />
      </PreviewSection>

      <PreviewSection dataKey="aboutSection" changed={changed('aboutSection')}>
        <AboutSection data={content.aboutSection} />
      </PreviewSection>

      <PreviewSection dataKey="footer" changed={changed('footer')}>
        <PreviewFooter footer={content.footer} />
      </PreviewSection>
    </div>
  );
}

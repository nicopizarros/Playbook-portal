import type { Metadata } from 'next';
import { getAllArticles } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { NewsGrid } from '@/components/home/NewsGrid';
import { HomeChoreography } from '@/components/home/HomeChoreography';
import { SiteMotion } from '@/components/SiteMotion';
import { MostReadSection } from '@/components/home/MostReadSection';
import { StillMattersSection } from '@/components/home/StillMattersSection';
import { HomeSidebar } from '@/components/home/HomeSidebar';
import { TopicDirectory } from '@/components/home/TopicDirectory';
import { OpinionSection } from '@/components/sections/OpinionSection';
import { ProductsSection } from '@/components/sections/ProductsSection';
import { MidCta } from '@/components/sections/MidCta';
import { VideoSection } from '@/components/sections/VideoSection';
import { InfinitasSection } from '@/components/sections/InfinitasSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { AdSlot } from '@/components/ads/AdSlot';
import { DEFAULT_OG_IMAGE, OG_DEFAULTS } from '@/lib/og-image';

// Fase 7 homepage order (decided in the homepage/ads brief, then tuned
// with user feedback — see HANDOFF.md's session entries):
//   1. Compact news package: hero + 5-row list + sidebar in one
//      three-column band (inline-feed ad after the sixth story, rail ad
//      + Más leídas + newsletter module in the sidebar). Kept
//      deliberately short — the 1+5 count is a compromise with the
//      sales side; don't grow it. Below it, "Lo que sigue importando"
//      (2026-08-05 design brief): up to 4 starred stories the rotation
//      no longer shows — a second window for still-relevant news, NOT a
//      growth of the 1+5 (different query, collapses when empty).
//   — leaderboard-home ad between the news package and Análisis —
//   2. Análisis/Opinión (v24 grid treatment)
//   3. Newsletter band — MidCta only (the CMS-editable one)
//   4. Topic directory (archive entry point)
//   5. Productos editoriales
//   — inline-mid-editorial ad between Productos and Video —
//   6. Video Playbook (two-video block + channel CTA; the Instagram
//      grid was scrapped — user feedback)
//   7. Infinitas three-column grid (vertical-sponsor ad inside the section)
//   8. Playbook en números + testimonios, compressed into one proof band
//   9. Acerca de Playbook
// The homepage was the only public route with no canonical at all — every
// other one declares `alternates.canonical` (/archivo, /articulo, /tema,
// /autor, /terminos, /privacidad). It matters most here: three hostnames
// serve this exact page today (playbook.la, www.playbook.la and the
// project's playbook-portal-phi.vercel.app deployment URL), and with no
// canonical it's the search engine, not us, that picks which one gets
// indexed. `openGraph.url` is set for the same reason on the social side.
// Both are relative — metadataBase in app/layout.tsx resolves them against
// the real production origin (lib/site-url.ts).
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...OG_DEFAULTS, type: 'website', url: '/', images: [DEFAULT_OG_IMAGE] },
};

export default async function HomePage() {
  const [articles, content] = await Promise.all([getAllArticles(), getSiteContent()]);

  return (
    <>
      <main className="container news-section" id="noticias">
        <NewsGrid articles={articles} sidebar={<HomeSidebar />} />
        {/* "Más leídas" as a full-width band under the news package
            (2026-08-06 — it lived in the rail and stretched it far past
            the 1+5 columns on tablets; see MostReadSection's comment).
            Not a growth of the 1+5: a derived module, like the one below. */}
        <MostReadSection />
        {/* "Lo que sigue importando" — directly below (design brief,
            2026-08-05): starred/featured stories from the last ~12 days
            that the rotation above no longer shows. Same React-cached
            articles array, no extra query; renders nothing on weeks with
            no qualifying stories. */}
        <StillMattersSection articles={articles} />
      </main>

      <AdSlot slot="leaderboard-home" />
      {/* `articles` is the same React-cached getAllArticles() result the
          news package above already uses — the opinion section derives its
          cards from the source='opinion' subset (see that component), so
          no extra query. */}
      <OpinionSection data={content.opinionSection} articles={articles} />
      <MidCta data={content.midCta} />
      <TopicDirectory />
      <ProductsSection data={content.productsSection} />
      <AdSlot slot="inline-mid-editorial" />
      <VideoSection data={content.videoSection} />
      <InfinitasSection data={content.infinitasSection} />
      <div className="proof-band">
        <StatsSection data={content.statsSection} />
        <TestimonialsSection data={content.testimonialsSection} />
      </div>
      <AboutSection data={content.aboutSection} />
      {/* Homepage-only motion (La Portada, 2026-08-05): green accents that
          sweep along the section rules on scroll, then fade back out.
          Mounted here, not in the layout, so no other route ships it. */}
      <HomeChoreography />
      {/* The Lectura motion vocabulary shared with the article page and the
          four hubs (lib/motion-kit.ts). On this page it only has the hero
          photo to work with — the stats, the cifra del día and the section
          rules already move under their own components, and SiteMotion's
          selectors exclude every one of them on purpose. */}
      <SiteMotion />
    </>
  );
}

import { getAllArticles } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { NewsGrid } from '@/components/home/NewsGrid';
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

// Fase 7 homepage order (decided in the homepage/ads brief, then tuned
// with user feedback — see HANDOFF.md's session entries):
//   1. Compact news package: hero + 5-row list + sidebar in one
//      three-column band (inline-feed ad after the sixth story, rail ad
//      + Más leídas + newsletter module in the sidebar). Kept
//      deliberately short — the 1+5 count is a compromise with the
//      sales side; don't grow it.
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
export default async function HomePage() {
  const [articles, content] = await Promise.all([getAllArticles(), getSiteContent()]);

  return (
    <>
      <main className="container news-section" id="noticias">
        <NewsGrid articles={articles} sidebar={<HomeSidebar />} />
      </main>

      <AdSlot slot="leaderboard-home" />
      <OpinionSection data={content.opinionSection} />
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
    </>
  );
}

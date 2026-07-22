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

// Fase 7 homepage order (decided in the homepage/ads brief — see
// HANDOFF.md's session entry):
//   1. Lead story + feed + sidebar (leaderboard + inline-feed + rail ads
//      live inside NewsGrid/HomeSidebar)
//   2. Análisis/Opinión (v24 grid treatment, moved up from below Most Read)
//   3. Newsletter band — MidCta only; the old duplicate nl-box is gone
//      (MidCta is the CMS-editable one, so the editable band is the one
//      that survives)
//   4. Topic directory (archive entry point)
//   5. Productos editoriales
//   — inline-mid-editorial ad between Productos and Video —
//   6. Video Playbook (trimmed) + 7. Instagram tiles (inside the same
//      dark band)
//   8. Infinitas three-column grid (vertical-sponsor ad inside the section)
//   10. Playbook en números + testimonios, compressed into one proof band
//   11. Acerca de Playbook
export default async function HomePage() {
  const [articles, content] = await Promise.all([getAllArticles(), getSiteContent()]);
  const instagramProfileUrl = content.footer.socialLinks.find(l =>
    /instagram\.com/i.test(l.url),
  )?.url;

  return (
    <>
      <main className="container news-section" id="noticias">
        <NewsGrid articles={articles} sidebar={<HomeSidebar />} />
      </main>

      <OpinionSection data={content.opinionSection} />
      <MidCta data={content.midCta} />
      <TopicDirectory />
      <ProductsSection data={content.productsSection} />
      <AdSlot slot="inline-mid-editorial" />
      <VideoSection data={content.videoSection} instagramProfileUrl={instagramProfileUrl} />
      <InfinitasSection data={content.infinitasSection} />
      <div className="proof-band">
        <StatsSection data={content.statsSection} />
        <TestimonialsSection data={content.testimonialsSection} />
      </div>
      <AboutSection data={content.aboutSection} />
    </>
  );
}

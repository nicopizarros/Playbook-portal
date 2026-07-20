import { getAllArticles } from '@/lib/data/articles';
import { getSiteContent } from '@/lib/data/site-content';
import { NewsGrid } from '@/components/home/NewsGrid';
import { NewsletterForm } from '@/components/shared/NewsletterForm';
import { OpinionSection } from '@/components/sections/OpinionSection';
import { ProductsSection } from '@/components/sections/ProductsSection';
import { MidCta } from '@/components/sections/MidCta';
import { VideoSection } from '@/components/sections/VideoSection';
import { InfinitasSection } from '@/components/sections/InfinitasSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { AboutSection } from '@/components/sections/AboutSection';

export default async function HomePage() {
  const [articles, content] = await Promise.all([getAllArticles(), getSiteContent()]);

  return (
    <>
      <a className="skip-link" href="#noticias">Saltar al contenido</a>

      <main className="container news-section" id="noticias">
        <NewsGrid articles={articles} />

        <div className="nl-box reveal">
          <div>
            <h3>Lo que mueve al deporte, sin tanto rollo</h3>
            <p>La newsletter para entender historias, decisiones y personajes que mueven el negocio del deporte.</p>
          </div>
          <NewsletterForm
            formClassName="nl-form"
            action="https://playbookmedia.substack.com/"
            emailId="nl-email-1"
            emailLabel="Tu correo"
            buttonLabel="Suscribirme"
            successMessage="¡Listo! Revisa tu correo."
          />
        </div>
      </main>

      <OpinionSection data={content.opinionSection} />
      <ProductsSection data={content.productsSection} />
      <MidCta data={content.midCta} />
      <VideoSection data={content.videoSection} />
      <InfinitasSection data={content.infinitasSection} />
      <StatsSection data={content.statsSection} />
      <TestimonialsSection data={content.testimonialsSection} />
      <AboutSection data={content.aboutSection} />
    </>
  );
}

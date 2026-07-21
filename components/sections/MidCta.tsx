import type { SiteContentData } from '@/lib/data/site-content';
import { safeUrl } from '@/lib/safe-url';
import { NewsletterForm } from '../shared/NewsletterForm';

export function MidCta({ data }: { data: SiteContentData['midCta'] }) {
  return (
    <section className="mid-cta">
      <div className="container">
        <div className="mid-cta-box reveal">
          <div>
            <h2>
              {data.headingMain} <em>{data.headingEm}</em>
            </h2>
            <p>{data.body}</p>
          </div>
          <NewsletterForm
            formClassName="mid-cta-form"
            action={safeUrl(data.formUrl)}
            emailId="nl-email-2"
            emailLabel="Correo electrónico"
            buttonLabel={data.buttonLabel}
            successMessage={data.successMessage}
          />
        </div>
      </div>
    </section>
  );
}

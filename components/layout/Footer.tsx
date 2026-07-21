import Link from 'next/link';
import { getSiteContent } from '@/lib/data/site-content';

export async function Footer() {
  const { footer } = await getSiteContent();

  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/assets/img/playbook-logo-dark.png" width={180} height={44} alt="Playbook" loading="lazy" decoding="async" />
          <p>{footer.brandBlurb}</p>
        </div>
        <div>
          <div className="social-row">
            {footer.socialLinks.map(s => (
              <a key={s.url} className="pill" href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <a className="pill inf-pill" href={footer.infinitasLinkUrl} target="_blank" rel="noopener noreferrer">
              {footer.infinitasLinkLabel}
            </a>
          </div>
        </div>
      </div>
      <div className="container footer-legal-row">
        <Link href="/privacidad">Aviso de Privacidad</Link>
        <Link href="/terminos">Términos y Condiciones</Link>
      </div>
      <div className="container footer-copyright">{footer.copyrightText}</div>
    </footer>
  );
}

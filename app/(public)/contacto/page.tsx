import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbele al equipo de Playbook: alianzas, publicidad, prensa o cualquier otra consulta.',
  alternates: { canonical: `${SITE_URL}/contacto` },
  robots: { index: true, follow: true },
};

export default function ContactoPage() {
  return (
    <main className="container legal-page contact-page" id="contacto-main">
      <h1>Contacto</h1>
      <p className="legal-updated">Alianzas, publicidad, prensa o cualquier otra consulta.</p>
      <p>
        Escríbenos y te contestamos directo a tu correo. Si buscas alianzas o publicidad, cuéntanos
        de tu marca y qué te gustaría lograr.
      </p>
      <ContactForm />
    </main>
  );
}

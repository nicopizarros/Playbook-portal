import type { Metadata } from 'next';
import Link from 'next/link';
import { EDITORIAL_PRINCIPLES } from '@/lib/data/leadership';
import { SITE_URL } from '@/lib/site-url';

// /estandares — the destination of "Leer nuestros estándares editoriales
// completos" on /nosotros, and of `publishingPrinciples` in the
// Organization JSON-LD. Both of those already pointed here in the round-1
// design, so the route has to exist or they 404.
//
// The design explicitly did NOT lay this page out ("No diseñada en esta
// entrega", Handoff Spec.dc.html §8), so this is deliberately the minimum
// honest version and nothing more: the same four rules /nosotros states,
// read in full, plus the things about them that are already true of the
// site. It invents no policy — every claim below is either one of the four
// approved rules or a fact about how Playbook already publishes.
//
// The expanded document (corrections policy, sourcing ladder, conflicts of
// interest) needs an editorial owner to write and sign it, and that owner
// is the open "Dirección editorial" question in docs/TODO.md. Until then
// this page is short and true rather than long and invented.

export const metadata: Metadata = {
  title: 'Estándares editoriales',
  description:
    'Las reglas con las que Playbook reporta el negocio del deporte: seguir el dinero, contexto ' +
    'antes que velocidad, etiquetar lo comercial y citar cada cifra.',
  alternates: { canonical: `${SITE_URL}/estandares` },
  robots: { index: true, follow: true },
};

export default function EstandaresPage() {
  return (
    <main className="container legal-page" id="estandares-main">
      <h1>Estándares editoriales</h1>
      <p className="legal-updated">
        Cuatro reglas que decidimos antes de cada nota, no después.
      </p>

      <p>
        Playbook cubre el negocio del deporte en México y Latinoamérica. Estas son las reglas con
        las que se decide qué se publica y cómo. Son las mismas cuatro que aparecen en{' '}
        <Link href="/nosotros#como-trabajamos">Nosotros</Link>, aquí en extenso.
      </p>

      {EDITORIAL_PRINCIPLES.map(rule => (
        <section key={rule.num}>
          <h2>
            {rule.num} · {rule.lead}
          </h2>
          <p>{rule.body}</p>
        </section>
      ))}

      <h2>Quién responde por esto</h2>
      <p>
        La dirección editorial fija la agenda de cobertura y es dueña de estos estándares. El
        directorio de firmas que publican en Playbook está en{' '}
        <Link href="/equipo">Equipo</Link>, y cada artículo lleva su autoría a la vista.
      </p>

      <h2>Correcciones</h2>
      <p>
        Si encuentras un dato incorrecto en algo que publicamos, escríbenos desde{' '}
        <Link href="/contacto">Contacto</Link> con el enlace de la nota y la corrección. Preferimos
        corregir a sostener.
      </p>

      <h2>Contenido comercial</h2>
      <p>
        Todo contenido patrocinado se identifica como tal donde aparece, sin excepción. El
        patrocinio no compra cobertura editorial ni la orienta; las conversaciones comerciales
        entran por <Link href="/contacto#alianzas">Alianzas</Link>, no por la redacción.
      </p>
    </main>
  );
}

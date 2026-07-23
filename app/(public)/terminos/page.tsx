import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';
import { FREE_ARTICLES_PER_MONTH } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  alternates: { canonical: `${SITE_URL}/terminos` },
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
  return (
    <main className="container legal-page" id="terminos-main">
      <h1>Términos y Condiciones</h1>
      <p className="legal-updated">Última actualización: 21 de julio de 2026.</p>

      <p>
        Al usar este sitio, operado por <strong>Playbook SAPI de C.V.</strong>
        (&quot;Playbook&quot;, &quot;nosotros&quot;), aceptas estos Términos y Condiciones. Si no
        estás de acuerdo, te pedimos que no uses el sitio.
      </p>

      <h2>Qué es Playbook</h2>
      <p>
        Playbook es un medio digital de noticias y análisis sobre el negocio del deporte en México y
        LATAM. El contenido editorial refleja el trabajo y la opinión de nuestro equipo y no
        constituye asesoría legal, financiera ni de inversión.
      </p>

      <h2>Acceso al contenido</h2>
      <p>
        Puedes leer hasta {FREE_ARTICLES_PER_MONTH} artículos gratuitos por mes sin registrarte. Para
        seguir leyendo más allá de ese límite, puedes registrarte con tu correo electrónico usando un
        enlace de acceso. Nos reservamos el derecho de cambiar este límite o el modelo de acceso en
        el futuro.
      </p>

      <h2>Cuentas</h2>
      <ul>
        <li>
          <strong>Lectores</strong>: el registro es gratuito y usa un enlace de acceso enviado por
          correo, sin contraseña. Sos responsable de mantener el acceso a tu propia casilla de
          correo.
        </li>
        <li>
          <strong>Editores</strong>: cuentas internas del equipo de Playbook, no disponibles para el
          público. Cada editor es responsable de la actividad realizada con su cuenta.
        </li>
      </ul>

      <h2>Uso aceptable</h2>
      <p>No está permitido usar el sitio para:</p>
      <ul>
        <li>Intentar eludir el límite de lectura gratuita de forma automatizada.</li>
        <li>Copiar o redistribuir contenido de Playbook sin autorización, más allá del uso personal.</li>
        <li>Intentar acceder sin autorización a áreas del sitio reservadas al equipo editorial.</li>
      </ul>

      <h2>Propiedad intelectual</h2>
      <p>
        Los artículos, textos, imágenes y demás contenido publicado en este sitio son propiedad de{' '}
        <strong>Playbook SAPI de C.V.</strong> o de terceros que nos autorizaron su uso. Puedes
        compartir enlaces a nuestros artículos libremente; para cualquier otro uso (reproducción,
        traducción, republicación), escribinos a <strong>hola@playbook.la</strong>.
      </p>

      <h2>Contenido y enlaces de terceros</h2>
      <p>
        Algunos artículos incluyen material embebido de terceros (por ejemplo, videos de YouTube o
        publicaciones de Instagram) o enlazan a sitios externos. No controlamos ese contenido y no
        somos responsables por él.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        El sitio se ofrece &quot;tal cual&quot;. Hacemos nuestro mejor esfuerzo por mantener la
        información precisa y el sitio disponible, pero no garantizamos que esté libre de errores o
        interrupciones. En la medida permitida por la ley, no somos responsables por daños derivados
        del uso del sitio.
      </p>

      <h2>Cambios a estos términos</h2>
      <p>
        Podemos actualizar estos Términos y Condiciones en cualquier momento. Los cambios relevantes
        se van a reflejar actualizando la fecha de arriba.
      </p>

      <h2>Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de <strong>[JURISDICCIÓN]</strong>.</p>

      <h2>Contacto</h2>
      <p>
        <strong>Playbook SAPI de C.V.</strong> — <strong>hola@playbook.la</strong>
      </p>
    </main>
  );
}

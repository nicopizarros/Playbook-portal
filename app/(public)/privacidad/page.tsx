import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  alternates: { canonical: `${SITE_URL}/privacidad` },
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <main className="container legal-page" id="privacidad-main">
      <h1>Aviso de Privacidad</h1>
      <p className="legal-updated">Última actualización: 21 de julio de 2026.</p>

      <p>
        Este Aviso de Privacidad describe cómo <strong>Playbook SAPI de C.V.</strong>{' '}
        (&quot;Playbook&quot;, &quot;nosotros&quot;), con domicilio en{' '}
        <strong>[DOMICILIO FISCAL]</strong>, trata los datos personales de quienes visitan y usan
        este sitio, en cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión
        de los Particulares (LFPDPPP) de México y, cuando aplique, de otras leyes de privacidad de la
        jurisdicción del visitante.
      </p>

      <h2>Qué datos recolectamos</h2>
      <ul>
        <li>
          <strong>Correo electrónico</strong>, si te registrás como lector para acceder a más
          artículos de los que permite el límite gratuito, a través de un enlace de acceso
          (&quot;magic link&quot;) enviado por correo. No pedimos ni guardamos contraseñas de
          lectores.
        </li>
        <li>
          <strong>Historial de lectura y una cookie de identificación anónima</strong> (
          <code>pb_anon</code>), para contar cuántos artículos leíste en el mes y aplicar el límite
          de artículos gratuitos. Si no iniciaste sesión, esta cookie no está asociada a tu nombre ni
          a tu correo.
        </li>
        <li>
          <strong>Datos de uso y navegación</strong> (páginas vistas, país/dispositivo aproximado,
          referidos) a través de Google Analytics 4 y Vercel Web Analytics — ver &quot;Terceros&quot;
          abajo.
        </li>
        <li>
          <strong>Credenciales de acceso del equipo editorial</strong>, si trabajás como editor de
          Playbook — estas cuentas son internas, no de lectores públicos.
        </li>
      </ul>

      <h2>Para qué usamos tus datos</h2>
      <ul>
        <li>Enviarte el enlace de acceso que vos mismo solicitaste.</li>
        <li>Aplicar el límite de artículos gratuitos por mes.</li>
        <li>Entender qué contenido funciona, para decisiones editoriales.</li>
        <li>Mantener la seguridad del sitio (por ejemplo, frenar intentos de acceso abusivos).</li>
      </ul>
      <p>No vendemos tus datos personales a terceros.</p>

      <h2>Cookies</h2>
      <p>Este sitio usa tres tipos de cookies:</p>
      <ul>
        <li>
          <strong>Necesaria</strong> (<code>pb_anon</code>): cuenta tus lecturas del mes. Sin ella, el
          sitio trata cada visita como si fuera la primera.
        </li>
        <li>
          <strong>Sesión</strong> (si iniciaste sesión como lector o editor): mantiene tu acceso
          activo entre páginas.
        </li>
        <li>
          <strong>Analítica</strong> (Google Analytics 4, Vercel Web Analytics): entender el tráfico
          del sitio en conjunto, no perfilarte individualmente.
        </li>
      </ul>
      <p>
        Podés borrar las cookies de este sitio en cualquier momento desde la configuración de tu
        navegador. Hacerlo no te bloquea el acceso, aunque sí reinicia el conteo de lecturas
        gratuitas.
      </p>

      <h2>Con quién compartimos datos (terceros)</h2>
      <ul>
        <li><strong>Resend</strong> — envío de los correos con el enlace de acceso.</li>
        <li><strong>Vercel</strong> — hospedaje del sitio, almacenamiento de imágenes, analítica de uso.</li>
        <li><strong>Google Analytics 4</strong> — analítica de uso.</li>
      </ul>
      <p>Cada uno procesa datos por nuestra cuenta, bajo sus propias políticas de privacidad.</p>

      <h2>Tus derechos (ARCO)</h2>
      <p>
        Como titular de tus datos, tenés derecho a Acceder, Rectificar, Cancelar u Oponerte (ARCO) al
        tratamiento de tus datos personales. Si sos lector registrado, podés exportar o eliminar tu
        cuenta y tu historial de lectura vos mismo, sin escribirnos, desde{' '}
        <a href="/cuenta">Mi cuenta</a>. Para cualquier otro pedido relacionado con tus datos,
        escribinos a <strong>hola@playbook.la</strong>.
      </p>

      <h2>Cambios a este aviso</h2>
      <p>
        Si cambiamos este aviso de forma relevante, lo vamos a indicar actualizando la fecha de
        arriba.
      </p>

      <h2>Contacto</h2>
      <p>
        <strong>Playbook SAPI de C.V.</strong> — <strong>hola@playbook.la</strong>
      </p>
    </main>
  );
}

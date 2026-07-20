import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playbook — El negocio del deporte',
  description:
    'Playbook: noticias, análisis, newsletters y video para entender el negocio del deporte en México y LATAM.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/NotFoundContent';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
};

// Next's catch-all convention — fires for any unmatched path under the
// (public) segment, so it inherits that layout's Header/Footer.
export default function NotFound() {
  return <NotFoundContent />;
}

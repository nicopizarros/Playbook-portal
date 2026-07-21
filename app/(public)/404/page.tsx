import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/NotFoundContent';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
};

// The literal /404 path — preserved per the brief's required URL list,
// distinct from not-found.tsx (Next's catch-all for any unmatched route).
// Renders the same content.
export default function LiteralNotFoundPage() {
  return <NotFoundContent />;
}

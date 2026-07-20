import type { NextConfig } from 'next';

// Legacy *.html URLs were live, indexed by Google, and already shared on
// WhatsApp/X before this migration (see HANDOFF.md's SEO history) — these
// redirects keep every existing inbound link and search ranking working
// after the extensionless App Router routes replace them.
const legacyHtmlRedirects = [
  { source: '/index.html', destination: '/' },
  { source: '/articulo.html', destination: '/articulo' },
  { source: '/archivo.html', destination: '/archivo' },
  { source: '/autor.html', destination: '/autor' },
  { source: '/tema.html', destination: '/tema' },
  { source: '/404.html', destination: '/404' },
];

const nextConfig: NextConfig = {
  async redirects() {
    return legacyHtmlRedirects.map(r => ({ ...r, permanent: true }));
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;

import { getAdSenseConfig } from '@/lib/adsense';

// AdSense requires this exact file at the site root once real inventory is
// live, or it flags the site as unauthorized to sell its own ad space.
// Empty (still 200, so nothing 404s) until ADSENSE_CLIENT_ID is set --
// consistent with AdSlot.tsx rendering nothing until then. One env var away
// from the real line appearing here too, same as every ad slot.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { clientId } = getAdSenseConfig();
  const body = clientId ? `google.com, ${clientId.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n` : '';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

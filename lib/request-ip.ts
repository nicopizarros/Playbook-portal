import { headers } from 'next/headers';

// Best-effort client identifier for rate limiting, not for anything
// security-sensitive by itself -- x-forwarded-for is client-suppliable in
// principle, but Vercel's own edge network sets/overwrites it for real
// traffic, which is the only place this app runs in production.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}

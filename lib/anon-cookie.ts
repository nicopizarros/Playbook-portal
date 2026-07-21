// Signs/verifies the anonymous-reader cookie (see middleware.ts). Uses Web
// Crypto (`crypto.subtle`) instead of Node's `crypto` module so the same
// code runs whether Next.js executes middleware on the Edge runtime or
// Node — Web Crypto is available on both, Node's `crypto` module isn't
// guaranteed on Edge. Reuses AUTH_SECRET (Auth.js already requires it) so
// this doesn't need its own env var; this cookie only identifies an
// anonymous free-article quota bucket, not a security-sensitive session,
// so it doesn't need a dedicated secret.

export const ANON_COOKIE_NAME = 'pb_anon';

function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Cookie value shape: "<uuid>.<base64url HMAC signature of uuid>"
export async function signAnonId(id: string): Promise<string> {
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  return `${id}.${toBase64Url(signature)}`;
}

// Returns the uuid if the cookie's signature is valid, otherwise null (a
// missing/tampered/unsigned-format cookie all just mean "mint a new one" —
// see middleware.ts — this is a quota-tracking identity, not an auth
// boundary, so failing open to "treat as a new anonymous reader" is fine).
export async function verifyAnonCookie(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const dotIndex = value.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const id = value.slice(0, dotIndex);
  const expected = await signAnonId(id);
  return expected === value ? id : null;
}

// Minimal HMAC-signed session tokens for /admin. No database, no third-party
// auth service — the token is just a signed, expiring claim that the caller
// knows ADMIN_PASSWORD. process.env.ADMIN_TOKEN_SECRET never leaves the server.

import crypto from 'crypto';

const DEFAULT_TTL_SECONDS = 8 * 60 * 60; // 8h

function toBase64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function getSecret() {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret) throw new Error('ADMIN_TOKEN_SECRET is not configured');
  return secret;
}

function sign(payloadB64) {
  return toBase64Url(crypto.createHmac('sha256', getSecret()).update(payloadB64).digest());
}

// Throws if ADMIN_TOKEN_SECRET is missing — callers must not fall back to
// issuing a token signed with a weak/known key.
export function signToken(payload, ttlSeconds) {
  const exp = Math.floor(Date.now() / 1000) + (ttlSeconds || DEFAULT_TTL_SECONDS);
  const payloadB64 = toBase64Url(Buffer.from(JSON.stringify({ ...payload, exp })));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const [payloadB64, sig] = token.split('.');
  let expected;
  try {
    expected = sign(payloadB64);
  } catch {
    // Secret missing/misconfigured: fail closed, no token is ever valid.
    return null;
  }
  const sigBuf = Buffer.from(sig || '');
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64).toString('utf-8'));
  } catch {
    return null;
  }
  if (!payload.exp || Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

export function constantTimeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function getBearerToken(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

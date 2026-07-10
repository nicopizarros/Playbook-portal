// api/admin-login.js
// Per-editor login for /admin. Accounts are configured as one Vercel env var
// (ADMIN_USERS = "aldo:pass1,nico:pass2,guillermo:pass3") — no database, no
// third-party auth. On success issues a short-lived signed token carrying the
// verified username, used later to attribute commits to the real editor.

import { signToken, constantTimeEqual } from '../lib/auth.js';

// Fixed-length dummy so a nonexistent username still pays the same
// constantTimeEqual cost as a real one — avoids a timing side-channel that
// could otherwise help enumerate valid usernames.
const DUMMY_PASSWORD = 'x'.repeat(64);
// Flat delay on every failed attempt: free, no external service, and slows
// a scripted brute force against the fixed set of accounts.
const FAILED_LOGIN_DELAY_MS = 400;

function parseUsers(raw) {
  const map = {};
  String(raw || '').split(',').forEach(pair => {
    const idx = pair.indexOf(':');
    if (idx === -1) return;
    const user = pair.slice(0, idx).trim().toLowerCase();
    const pass = pair.slice(idx + 1).trim();
    if (user && pass) map[user] = pass;
  });
  return map;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const users = parseUsers(process.env.ADMIN_USERS);
  const key = String(username || '').trim().toLowerCase();
  const userExists = Object.prototype.hasOwnProperty.call(users, key);
  const expectedPassword = userExists ? users[key] : DUMMY_PASSWORD;
  const passwordOk = constantTimeEqual(password || '', expectedPassword);

  if (!userExists || !passwordOk) {
    await sleep(FAILED_LOGIN_DELAY_MS);
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  let token;
  try {
    token = signToken({ name: key });
  } catch {
    return res.status(500).json({ error: 'El servidor no está configurado correctamente' });
  }
  return res.status(200).json({ token, name: key });
}

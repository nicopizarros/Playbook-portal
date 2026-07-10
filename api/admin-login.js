// api/admin-login.js
// Per-editor login for /admin. Accounts are configured as one Vercel env var
// (ADMIN_USERS = "aldo:pass1,nico:pass2,guillermo:pass3") — no database, no
// third-party auth. On success issues a short-lived signed token carrying the
// verified username, used later to attribute commits to the real editor.

import { signToken, constantTimeEqual } from '../lib/auth.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const users = parseUsers(process.env.ADMIN_USERS);
  const key = String(username || '').trim().toLowerCase();
  const expectedPassword = users[key];

  if (!expectedPassword || !password || !constantTimeEqual(password, expectedPassword)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const token = signToken({ name: key });
  return res.status(200).json({ token, name: key });
}

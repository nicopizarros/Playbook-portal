// api/admin-login.js
// Password login for /admin. Verifies against process.env.ADMIN_PASSWORD and
// issues a short-lived signed token — no accounts, no database.

import { signToken, constantTimeEqual } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, name } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !password || !constantTimeEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = signToken({ name: String(name || '').slice(0, 60) });
  return res.status(200).json({ token });
}

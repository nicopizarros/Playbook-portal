// api/admin-save.js
// Commits an admin-edited content.json or articles.json back to GitHub.
// file is whitelisted to two literal paths; sha enforces optimistic concurrency
// (GitHub returns 409 if someone else saved first, passed through as-is).

import { verifyToken, getBearerToken } from '../lib/auth.js';
import { writeFile } from '../lib/github.js';

const ALLOWED_FILES = {
  content: 'content.json',
  articles: 'articles.json'
};

const CONTENT_SECTION_KEYS = [
  'nav', 'opinionSection', 'productsSection', 'midCta', 'videoSection',
  'infinitasSection', 'statsSection', 'testimonialsSection', 'aboutSection', 'footer'
];

function isValidShape(fileKey, data) {
  if (!data || typeof data !== 'object') return false;
  if (fileKey === 'articles') return Array.isArray(data.articles);
  return CONTENT_SECTION_KEYS.every(k => k in data);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const claims = verifyToken(getBearerToken(req));
  if (!claims) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { file: fileKey, data, sha } = req.body || {};
  const file = ALLOWED_FILES[fileKey];
  if (!file || !sha) {
    return res.status(400).json({ error: 'Missing file or sha' });
  }
  if (!isValidShape(fileKey, data)) {
    return res.status(400).json({ error: 'Invalid data shape' });
  }

  const payload = { ...data, lastUpdated: new Date().toISOString() };
  const committer = claims.name
    ? { name: claims.name, email: 'admin@playbook.la' }
    : { name: 'Playbook Admin', email: 'admin@playbook.la' };

  try {
    await writeFile(file, payload, sha, `[Admin] Actualiza ${file}`, committer);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

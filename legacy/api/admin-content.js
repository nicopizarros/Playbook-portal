// api/admin-content.js
// Returns a fresh (uncached) copy of content.json or articles.json plus its
// GitHub sha, for the admin UI to edit and later save with optimistic concurrency.

import { verifyToken, getBearerToken } from '../lib/auth.js';
import { readFile } from '../lib/github.js';

const ALLOWED_FILES = {
  content: 'content.json',
  articles: 'articles.json'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const claims = verifyToken(getBearerToken(req));
  if (!claims) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const file = ALLOWED_FILES[req.query.file];
  if (!file) {
    return res.status(400).json({ error: 'Invalid file' });
  }

  try {
    const { json, sha } = await readFile(file);
    return res.status(200).json({ json, sha });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

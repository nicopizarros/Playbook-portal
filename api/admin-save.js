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

// Spot-check the list fields every template function relies on being an
// array (nav.links.map(...), etc.) — a save that passed the shallow
// top-level-key check but left one of these as the wrong type used to throw
// mid-render on the live site with no isolation between sections.
const CONTENT_ARRAY_FIELDS = [
  ['nav', 'links'],
  ['opinionSection', 'cards'],
  ['productsSection', 'products'],
  ['videoSection', 'clips'],
  ['videoSection.featured', 'episodeLinks'],
  ['videoSection.featured', 'paragraphs'],
  ['infinitasSection', 'sideCards'],
  ['statsSection', 'stats'],
  ['testimonialsSection', 'testimonials'],
  ['aboutSection', 'actions'],
  ['footer', 'socialLinks']
];

function isValidShape(fileKey, data) {
  if (!data || typeof data !== 'object') return false;
  if (fileKey === 'articles') return Array.isArray(data.articles);
  if (!CONTENT_SECTION_KEYS.every(k => k in data)) return false;
  return CONTENT_ARRAY_FIELDS.every(([path, field]) => {
    const obj = path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), data);
    return obj && Array.isArray(obj[field]);
  });
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
    const result = await writeFile(file, payload, sha, `[Admin] Actualiza ${file}`, committer);
    return res.status(200).json({ status: 'ok', sha: result.content.sha });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

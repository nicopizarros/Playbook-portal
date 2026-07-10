// Shared GitHub Contents API helper used by all admin write-back endpoints.
// Deliberately lives outside /api so Vercel never treats it as a route.

const REPO = 'nicopizarros/Playbook-portal';
const API_BASE = `https://api.github.com/repos/${REPO}/contents/`;

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

export async function readFile(path) {
  const res = await fetch(API_BASE + path, { headers: headers() });
  if (!res.ok) {
    const err = new Error(`No se pudo leer ${path} desde GitHub (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const fileData = await res.json();
  const json = JSON.parse(
    Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  );
  return { json, sha: fileData.sha };
}

export async function writeFile(path, json, sha, message, committer) {
  const content = Buffer.from(JSON.stringify(json, null, 2)).toString('base64');
  const res = await fetch(API_BASE + path, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({
      message,
      content,
      sha,
      committer: committer || { name: 'Playbook Admin', email: 'admin@playbook.la' }
    })
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `No se pudo guardar ${path} en GitHub (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

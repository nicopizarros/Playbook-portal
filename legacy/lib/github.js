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

const RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retries only transient failures (network errors, 5xx, 429). A real 409
// conflict or 401/403 must fail immediately, not be retried.
async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const transient = !err.status || err.status >= 500 || err.status === 429;
      if (!transient || attempt === RETRY_ATTEMPTS) throw err;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }
  throw lastErr;
}

export async function readFile(path) {
  return withRetry(async () => {
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
  });
}

export async function writeFile(path, json, sha, message, committer) {
  return withRetry(async () => {
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
  });
}

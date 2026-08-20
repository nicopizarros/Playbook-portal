// Regression suite for lib/slack.ts's message builder plus an optional
// live end-to-end POST.
//
//   node --import tsx scripts/test-slack-notification.mjs        # offline
//   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
//     node --import tsx scripts/test-slack-notification.mjs --live
//
// The offline half needs no network and no Slack workspace: it asserts on
// the payload the module would send. That matters because every bug this
// file guards against (an unescaped "&" in a title, a relative imageUrl
// attached as an accessory, a non-Slack host in the env var) produces a
// perfectly successful HTTP 200 and a wrong or leaked message — the kind
// of failure a live smoke test reports as a pass.

import { buildNewArticleMessage, notifyNewArticle, articlePermalink } from '../lib/slack.ts';

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const base = {
  id: 'lfa-final-2026',
  title: 'Caudillos & Dinos: la final que <redefine> a la LFA',
  excerpt: '  Dos franquicias   jóvenes   se reparten el mercado del norte.  ',
  author: 'Guillermo Mejía',
  publication: 'Noticias',
  origin: 'webhook',
};

console.log('\nbuildNewArticleMessage');
{
  const msg = buildNewArticleMessage(base);
  const section = msg.blocks.find(b => b.type === 'section');
  const context = msg.blocks.find(b => b.type === 'context');

  check('header block first', msg.blocks[0].type === 'header');
  check('fallback text carries title and url',
    msg.text.includes('Caudillos') && msg.text.includes('/articulo?id=lfa-final-2026'));
  check('title is a linked mrkdwn bold',
    section.text.text.startsWith(`*<${articlePermalink(base.id)}|`));
  check('mrkdwn specials escaped in the title',
    section.text.text.includes('&amp;') &&
    section.text.text.includes('&lt;redefine&gt;') &&
    !/[^&]&[^a#]/.test(section.text.text.split('\n')[0].replace(/&amp;|&lt;|&gt;/g, '')),
    section.text.text);
  check('excerpt whitespace collapsed',
    section.text.text.includes('Dos franquicias jóvenes se reparten'));
  check('webhook origin labelled', context.elements[0].text.includes('webhook Make.com'));
  check('author shown', context.elements[0].text.includes('por Guillermo Mejía'));
  check('no accessory without an image', section.accessory === undefined);
}

console.log('\nimage accessory');
{
  const https = buildNewArticleMessage({ ...base, imageUrl: 'https://blob.vercel-storage.com/x.jpg' });
  const rel = buildNewArticleMessage({ ...base, imageUrl: '/images/x.jpg' });
  const http = buildNewArticleMessage({ ...base, imageUrl: 'http://insecure.example/x.jpg' });
  const sec = m => m.blocks.find(b => b.type === 'section');

  check('absolute https image attached', sec(https).accessory?.image_url === 'https://blob.vercel-storage.com/x.jpg');
  check('relative path not attached', sec(rel).accessory === undefined);
  check('plain http not attached', sec(http).accessory === undefined);
}

console.log('\nadmin origin');
{
  const msg = buildNewArticleMessage({ ...base, origin: 'admin', editor: 'Nico' });
  const context = msg.blocks.find(b => b.type === 'context');
  check('editor name shown', context.elements[0].text.includes('panel editorial · Nico'));

  const anon = buildNewArticleMessage({ ...base, origin: 'admin' });
  check('no dangling separator without an editor name',
    anon.blocks.find(b => b.type === 'context').elements[0].text.endsWith('panel editorial'));
}

console.log('\nscript origin (scripts/publish-newsletter.ts — the publish skills\' path)');
{
  const msg = buildNewArticleMessage({ ...base, origin: 'script' });
  const context = msg.blocks.find(b => b.type === 'context');
  check('automated origin labelled', context.elements[0].text.includes('publicación automatizada'));
  check('not mislabelled as the webhook', !context.elements[0].text.includes('Make.com'));
}

console.log('\ntruncation');
{
  const msg = buildNewArticleMessage({ ...base, excerpt: 'a'.repeat(500) });
  const body = msg.blocks.find(b => b.type === 'section').text.text.split('\n')[1];
  check('excerpt capped at 280 with an ellipsis', body.length === 280 && body.endsWith('…'), `len=${body.length}`);
}

console.log('\nwebhook url gate (no network — every case must short-circuit)');
{
  const cases = [
    ['unset', undefined, 'no está configurada'],
    ['blank', '   ', 'no está configurada'],
    ['not a url', 'hooks.slack.com/services/x', 'no es una URL válida'],
    ['wrong host', 'https://evil.example/collect', 'hooks.slack.com'],
    ['http scheme', 'http://hooks.slack.com/services/x', 'hooks.slack.com'],
  ];
  for (const [label, value, expected] of cases) {
    if (value === undefined) delete process.env.SLACK_WEBHOOK_URL;
    else process.env.SLACK_WEBHOOK_URL = value;
    const res = await notifyNewArticle(base);
    check(`${label} rejected`, res.sent === false && res.reason.includes(expected), JSON.stringify(res));
  }
  delete process.env.SLACK_WEBHOOK_URL;
}

console.log('\noutbound request (fetch stubbed — asserts the wire format, not just the builder)');
{
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/xxxx';
  const realFetch = globalThis.fetch;
  let seen = null;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, text: async () => '' };
  };
  const res = await notifyNewArticle(base);
  globalThis.fetch = realFetch;
  delete process.env.SLACK_WEBHOOK_URL;

  check('POSTs to the configured webhook', seen?.url === 'https://hooks.slack.com/services/T000/B000/xxxx');
  check('method POST + json content type',
    seen?.init.method === 'POST' && seen?.init.headers['Content-Type'] === 'application/json');
  check('body is the built message', JSON.stringify(buildNewArticleMessage(base)) === seen?.init.body);
  check('request carries an abort signal', typeof seen?.init.signal?.aborted === 'boolean');
  check('2xx reported as sent', res.sent === true);
}

console.log('\nnon-2xx and transport failure');
{
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/xxxx';
  const realFetch = globalThis.fetch;

  globalThis.fetch = async () => ({ ok: false, status: 400, text: async () => 'invalid_payload' });
  const bad = await notifyNewArticle(base);
  check('400 surfaces status and Slack body',
    bad.sent === false && bad.reason.includes('400') && bad.reason.includes('invalid_payload'), JSON.stringify(bad));

  globalThis.fetch = async () => { throw new Error('ECONNRESET'); };
  const dead = await notifyNewArticle(base);
  check('transport error returned, never thrown', dead.sent === false && dead.reason.includes('ECONNRESET'));

  globalThis.fetch = async () => { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e; };
  const slow = await notifyNewArticle(base);
  check('timeout reported as a timeout', slow.sent === false && /no respondió en \d+ ms/.test(slow.reason), slow.reason);

  globalThis.fetch = realFetch;
  delete process.env.SLACK_WEBHOOK_URL;
}

if (process.argv.includes('--live')) {
  console.log('\nlive POST');
  process.env.SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL_LIVE || process.env.SLACK_WEBHOOK_URL;
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.log('  skip  --live needs SLACK_WEBHOOK_URL in the environment');
  } else {
    const res = await notifyNewArticle({ ...base, title: '[prueba] ' + base.title });
    check('Slack accepted the payload', res.sent === true, res.sent ? '' : res.reason);
  }
}

console.log(`\n${failures === 0 ? 'PASS' : `FAIL (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);

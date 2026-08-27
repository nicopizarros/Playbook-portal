// Renders the round-7 devices into a standalone HTML file so their design
// can be looked at before shipping. Writes to the path given as argv[2].
//
//   npx tsx scripts/preview-new-devices.ts /tmp/devices.html
import { writeFileSync, readFileSync } from 'node:fs';
import { deviceFromParagraph } from '../lib/article-devices';

const SAMPLES = [
  'Control: EverPass Media · De — NFL 32 Equity y RedBird · A — DAZN · Incluye — derechos comerciales de Sunday Ticket · Términos — no revelados',
  'Alcance: Sunday Ticket comercial · Incluye — bares y restaurantes · Incluye — plataforma multipantalla · Fuera — hogares (YouTube TV) · Fuera — mercados internacionales',
  'Condiciones: Patrocinio The Athletic-Kalshi · Aval de The New York Times Company — pendiente · Litigio estatal resuelto — en disputa · Acuerdo firmado — pendiente',
  'Precedentes: Ligas que eliminaron su juego de estrellas · NHL — lo cambió por un torneo de países · MLB — lo mantiene con rating a la baja · NBA — tres cambios de formato en diez años',
  'Contraste: Enhanced Games, Q2 2026 · Dice — involucró a mil millones de personas · Midió — 4 millones de vistas en vivo · Fuente — su propio reporte trimestral',
];

const css = ['tokens.css', 'reset.css', 'article.css', 'lectura.css']
  .map(f => readFileSync(`${process.cwd()}/styles/${f}`, 'utf8'))
  .join('\n');

const blocks = SAMPLES.map(s => {
  const d = deviceFromParagraph(s);
  if (!d) return `<p style="color:red;font-weight:700">NO RENDERIZA: ${s}</p>`;
  return `<p style="font:600 11px/1.4 monospace;color:#888;margin:34px 0 6px">${s}</p>${d.markup}`;
}).join('\n');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>${css}</style>
<style>body{background:var(--paper);padding:36px 20px;}
.wrap{max-width:680px;margin:0 auto;}</style></head>
<body><div class="wrap article-detail article-product-noticias">${blocks}</div></body></html>`;

writeFileSync(process.argv[2] || 'devices.html', html);
console.log(`escrito: ${process.argv[2]}`);

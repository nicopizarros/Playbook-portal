// Regression cases for the two scale bases and the device/lead-in boundary
// in lib/article-devices.ts.
//
// Added 2026-08-25 after the incoherence audit found a correct `Ecuación`
// shipping as a bare label: `magnitudeOf` is denominated in millions (a
// relative comparator) and `parseEquation`'s self-check was using it as an
// absolute evaluator, so any equation mixing a bare term with a scale-worded
// result was rejected as bad arithmetic and degraded to plain text.
//
// The lesson the cases are shaped around: a guard that FAILS CLOSED needs
// accept-case coverage as much as reject-case coverage. The old check had
// neither, so a silent false negative sat in production for a week.
//
//   npx tsx scripts/test-device-guards.ts
import { deviceFromParagraph } from '../lib/article-devices';

type Case = { text: string; render: boolean; why: string };

const CASES: Case[] = [
  // ——— Ecuación: must ACCEPT correct arithmetic across scale bases
  {
    text: 'Ecuación: 832 spots × US$300,000 por spot = US$249.6 millones',
    render: true,
    why: 'the live FIFA case: bare terms, scale-worded result, arithmetic correct',
  },
  { text: 'Ecuación: 832 spots × US$300,000 por spot = US$249.6 M', render: true, why: 'same, with the M spelling' },
  { text: 'Ecuación: 832 × 300,000 = 249,600,000', render: true, why: 'same equation with no scale words at all' },
  { text: 'Ecuación: 100 millones + 100 millones = 200 millones', render: true, why: 'all terms scaled' },
  { text: 'Ecuación: 2 mil millones / 4 mercados = 500 millones', render: true, why: 'mixed scale words, correct' },

  // ——— Ecuación: must still REJECT arithmetic that is actually wrong
  {
    text: 'Ecuación: 832 spots × US$300,000 por spot = US$500 millones',
    render: false,
    why: 'wrong by 2x — the self-check has to keep catching this',
  },
  { text: 'Ecuación: 100 millones + 100 millones = 500 millones', render: false, why: 'wrong, all scaled' },

  // ——— Duelo / Serie: a mixed scale basis draws a bar 1e6 out, so refuse it
  {
    text: 'Duelo: A vs B · Ingresos — US$300,000 vs US$1.7 millones',
    render: false,
    why: 'mixed basis: one bar would be 176,000x too long',
  },
  {
    text: 'Duelo: UEFA vs FIFA · Ingresos — €3,861 millones vs US$1,748 millones · Reservas — €600 millones vs US$4,000 millones',
    render: true,
    why: 'every row scaled — the normal case, must not regress',
  },
  {
    text: 'Duelo: A vs B · Partidos — 38 vs 34 · Sedes — 12 vs 9',
    render: true,
    why: 'bare counts under 1,000 are not amounts someone dropped a scale word from',
  },
  {
    text: 'Serie: UEFA vs FIFA · 2022 — €4,052 millones vs US$5,769 millones · 2023 — €4,321 millones vs US$1,170 millones · 2024 — €4,600 millones vs US$1,300 millones',
    render: true,
    why: 'the live Serie — every point scaled',
  },

  // ——— A bold prose lead-in is not a device declaration, even when its
  //     sentence is item-shaped. The archive's real collisions are
  //     `**El calendario:**` and `**El perfil:**`.
  {
    text: '**El calendario:** Las federaciones tienen hasta el 19 de septiembre — y luego vota el Congreso',
    render: false,
    why: 'bold label + prose outside it is a lead-in, however item-shaped the sentence',
  },
  {
    text: '**El perfil:** Iturbide entró como becario — y ascendió · hasta la presidencia',
    render: false,
    why: 'same collision, with separators that would otherwise parse',
  },
  {
    text: 'Calendario: 19 sep 2026 — Congreso de la FIFA · 18 mar 2027 — Elección presidencial',
    render: true,
    why: 'the plain-paragraph declaration every real device uses must still render',
  },
  {
    text: 'Perfil: Victor Montagliani · Cargo — Presidente de Concacaf · Desde — 2016',
    render: true,
    why: 'the live Perfil — must not be caught by the lead-in guard',
  },

  // ——— Round 7 (2026-08-27): the five low-figure devices.
  //
  // Every one of these is FAIL-CLOSED (an unknown label or a missing
  // required half degrades the whole declaration to plain text), so each
  // gets accept coverage as well as reject coverage — the lesson this file
  // was created for.

  // Control: the transfer with no price.
  {
    text: 'Control: EverPass Media · De — NFL 32 Equity y RedBird · A — DAZN · Incluye — derechos comerciales de Sunday Ticket · Términos — no revelados',
    render: true,
    why: 'the live DAZN/EverPass case: the shape that had no device before this',
  },
  {
    text: 'Control: EverPass Media · De — RedBird · A — DAZN',
    render: true,
    why: 'De and A alone are enough; Incluye/Términos/Fecha are optional',
  },
  {
    text: 'Control: EverPass Media · De — RedBird · A — DAZN · Precio — US$1,000M',
    render: false,
    why: 'a transfer WITH a price is a Venta — Precio is not in this vocabulary',
  },
  { text: 'Control: EverPass Media · De — RedBird', render: false, why: 'A is required — half a transfer is not one' },

  // Alcance: the boundary, which needs both sides.
  {
    text: 'Alcance: Sunday Ticket comercial · Incluye — bares y restaurantes · Fuera — hogares (YouTube TV)',
    render: true,
    why: 'one row each side is the minimum real boundary',
  },
  {
    text: 'Alcance: Sunday Ticket comercial · Incluye — bares · Incluye — restaurantes · Incluye — hoteles',
    render: false,
    why: 'no outside: a scope with nothing excluded is an Alineación, not a boundary',
  },
  {
    text: 'Alcance: Sunday Ticket comercial · Fuera — hogares · Fuera — internacional',
    render: false,
    why: 'no inside: the mirror of the same rule',
  },

  // Condiciones: fixed state vocabulary, like Escenarios' likelihoods.
  {
    text: 'Condiciones: Patrocinio The Athletic-Kalshi · Aval de The New York Times Company — pendiente · Litigio estatal resuelto — en disputa',
    render: true,
    why: 'the live Kalshi case: two real states',
  },
  {
    text: 'Condiciones: Patrocinio X · Aval del consejo — probable · Firma — pendiente',
    render: false,
    why: '"probable" is Escenarios vocabulary — a likelihood is not a condition state',
  },
  {
    text: 'Condiciones: Patrocinio X · Aval del consejo — 60%',
    render: false,
    why: 'an authored percentage is exactly the fake precision the fixed vocabulary bans',
  },

  // Precedentes: N actors, no dates, no spine.
  {
    text: 'Precedentes: Ligas que eliminaron su juego de estrellas · NHL — lo cambió por un torneo de países · MLB — lo mantiene con rating a la baja',
    render: true,
    why: 'the pattern shape Cronología was being bent into',
  },
  {
    text: 'Precedentes: Ligas que cambiaron de formato · NHL — lo cambió por un torneo de países',
    render: false,
    why: 'one precedent is an example, not a pattern — two rows minimum',
  },

  // Contraste: both halves required, and it is an accusation without them.
  {
    text: 'Contraste: Enhanced Games, Q2 2026 · Dice — involucró a mil millones de personas · Midió — 4 millones de vistas en vivo',
    render: true,
    why: "voice-and-style.md §6's own worked example",
  },
  {
    text: 'Contraste: Enhanced Games, Q2 2026 · Dice — involucró a mil millones de personas · Midió — 4 millones de vistas en vivo · Fuente — su reporte trimestral',
    render: true,
    why: 'the optional Fuente row, which this device wants more than any other',
  },
  {
    text: 'Contraste: Enhanced Games · Dice — involucró a mil millones de personas',
    render: false,
    why: 'a claim with nothing measured against it is a pull quote, not a contrast',
  },
  {
    text: 'Contraste: Enhanced Games · Midió — 4 millones de vistas · Fuente — su reporte',
    render: false,
    why: 'a measurement with no claim is a Cifra clave',
  },

  // The lead-in boundary, re-checked for the new prefixes. `**El control:**`
  // and `**El alcance:**` are plausible bold prose lead-ins (voice-and-style
  // §5) and must never be parsed as declarations.
  {
    text: '**El control:** la liga conserva la última palabra sobre el calendario y no la cede en el acuerdo.',
    render: false,
    why: 'bold label then prose — a lead-in, not a Control declaration',
  },
  {
    text: '**El alcance:** el paquete cubre mucho más de lo que el comunicado sugiere a primera vista.',
    render: false,
    why: 'same guard for Alcance',
  },
];

let failed = 0;
for (const c of CASES) {
  const got = deviceFromParagraph(c.text) !== null;
  const ok = got === c.render;
  if (!ok) failed++;
  console.log(
    `${ok ? '  ok  ' : 'FAIL  '}${c.render ? 'renders' : 'refuses'}  ${c.why}\n        ${c.text.slice(0, 96)}`,
  );
}
console.log(`\n${CASES.length - failed}/${CASES.length} device cases pass`);
process.exit(failed ? 1 : 0);

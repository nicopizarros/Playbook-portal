// Pins the negative-parallelism detector in scripts/check-voice.mjs to the
// family voice-and-style.md §2 actually defines.
//
// The cap is one per piece and the guide says "a second one is a rewrite, not
// a discussion", so the count has to be right in both directions: a miss lets
// a piece ship wearing the costume twice, and a false positive forces a
// rewrite the rule never asked for. Cases below are the guide's own four
// shapes, the three Opinións published 2026-08-11 that the old detector scored
// zero on, and real archive prose that must stay at zero.
//
//   node scripts/test-voice-antithesis.mjs

import { findNegatives } from './check-voice.mjs';

const CASES = [
  // --- the four shapes voice-and-style.md §2 enumerates -------------------
  ['no es X, es Y', 'La diferencia no es quién tiene acceso, es quién lo vuelve útil más rápido.', 1],
  ['no solo X, sino Y', 'El acuerdo no solo cambia el precio, sino quién lo fija.', 1],
  ['no solo X sino Y (sin coma)', 'El acuerdo no solo cambia el precio sino quién lo fija.', 1],
  ['el golpe no vino de A, vino de B', 'El golpe no vino de la liga, vino de sus propios clubes.', 1],
  ['deja de ser A y se convierte en B', 'El descanso deja de ser una pausa y se convierte en inventario.', 1],

  // --- the three that shipped 2026-08-11 scoring zero ---------------------
  ['A1 Fórmula E', 'Disney no compró carreras, compró fechas fijas que obligan a abrir la aplicación en enero.', 1],
  ['A2 Trump/FIFA', 'Trump no defendió una gestión, cambió la pregunta de la elección.', 1],
  [
    'A3 Apollo/Yankees',
    'El tope de 15% de la MLB no dejó fuera al capital privado, le cambió el instrumento.',
    1,
  ],

  // --- must stay at zero: real archive prose with "no" and a comma --------
  [
    'negación simple + subordinada',
    'FIFA confirmó que la propuesta para vender una participación no seguirá adelante, tras la oposición de UEFA.',
    0,
  ],
  [
    'negación + enumeración',
    'El fondo no recibiría ni participación accionaria ni poder de decisión sobre la liga, solo el derecho a cobrar contra ingresos futuros.',
    0,
  ],
  [
    'negación sin segunda cláusula verbal',
    'La federación advirtió que no reconocerá ningún proceso que se convoque al margen de esa institucionalidad.',
    0,
  ],
  [
    'contraste nominal invertido (fuera de la familia)',
    'Es un parentesco, no una línea documentada entre la Casa Blanca y la operación.',
    0,
  ],
  [
    'prosa normal con comas',
    'La temporada arranca el 18 de diciembre en Yeda y cierra el 25 de julio de 2027 en Tokio, con 21 carreras repartidas en 13 sedes.',
    0,
  ],
  [
    'sustantivo terminado en -ía no es verbo',
    'La policía no intervino en el operativo, según el comunicado de la federación.',
    0,
  ],

  // --- counting: two in one piece must read as two, not one or four -------
  [
    'dos antítesis en un cuerpo',
    'Disney no compró carreras, compró fechas fijas.\n\nY el tope no dejó fuera al capital, le cambió el instrumento.',
    2,
  ],
  [
    'solapamiento no se cuenta doble',
    'La palanca no es una regla de propiedad, sino un contrato.',
    1,
  ],
];

let failed = 0;
for (const [name, text, want] of CASES) {
  const found = findNegatives(text);
  const ok = found.length === want;
  if (!ok) failed++;
  console.log(`${ok ? '  ok  ' : 'FAIL  '}${String(found.length)}/${want}  ${name}`);
  if (!ok) {
    console.log(`        texto: ${text.replace(/\n+/g, ' ⏎ ').slice(0, 100)}`);
    found.forEach(f => console.log(`        detectado: "${f}"`));
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} casos pasan`);
process.exit(failed ? 1 : 0);

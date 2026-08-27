// The design suite's sample table — one canonical declaration per device,
// straight from dynamic-element-library.md §2. Shared by the /admin/estilo
// page and any harness that wants to assert every sample still renders.
export type SampleDef = { name: string; group: string; note: string; syntax: string };

export const SAMPLES: SampleDef[] = [
  // — Cifras y dinero
  { name: 'Cifra clave', group: 'Cifras y dinero', note: 'el número de la historia', syntax: 'Cifra clave: US$720 millones — el valor del nuevo espacio comercial' },
  { name: 'Recibo', group: 'Cifras y dinero', note: 'la cuenta, desglosada', syntax: 'Recibo: Torneos — 10 · Bolsa por evento — US$10M · Total — US$107M' },
  { name: 'Ecuación', group: 'Cifras y dinero', note: 'la aritmética del negocio', syntax: 'Ecuación: 104 partidos × US$6M por partido = US$624M' },
  { name: 'Salto', group: 'Cifras y dinero', note: 'antes → después', syntax: 'Salto: 14 torneos → 10 torneos — el calendario 2027' },
  { name: 'Reparto', group: 'Cifras y dinero', note: 'un todo, en proporciones', syntax: 'Reparto: FIFA — 70% · Federaciones — 20% · Clubes — 10%' },
  { name: 'Cascada', group: 'Cifras y dinero', note: 'de ingresos a margen, con la aritmética verificada', syntax: 'Cascada: Ingresos — US$4,210M · Producción — −US$1,900M · Derechos — −US$1,400M · Margen — US$910M' },
  { name: 'Tablero', group: 'Cifras y dinero', note: 'el resumen de mercado en tiles', syntax: 'Tablero: Mercado de verano 2026 · Gasto total — €9,870M · Operaciones — 412 · Récord — €180M (Mbappé)' },
  // — Tiempo
  { name: 'Cronología', group: 'Tiempo', note: 'la saga, hacia atrás', syntax: 'Cronología: 2022 — PIF entra · 2024 — recorte · 2026 — salida' },
  { name: 'Calendario', group: 'Tiempo', note: 'lo que viene, con "en N meses" computado', syntax: 'Calendario: nov 2026 — Voto de sedes · mar 2027 — Opt-out de TV · 2028 — Expira el CBA' },
  { name: 'Serie', group: 'Tiempo', note: 'dos líneas sobre un eje', syntax: 'Serie: UEFA vs FIFA · 2022 — €4,052M vs US$5,769M · 2023 — €4,321M vs US$1,170M · 2024 — €6,777M vs US$483M · 2025 — €5,014M vs US$2,661M' },
  // — Actores y poder
  { name: 'Jugada', group: 'Actores y poder', note: 'la conexión de dos partes', syntax: 'Jugada: Volkswagen ↔ Bayern' },
  { name: 'Alineación', group: 'Actores y poder', note: 'el roster', syntax: 'Alineación: Madonna · Shakira · Justin Bieber · BTS' },
  { name: 'Duelo', group: 'Actores y poder', note: 'dos instituciones, varias métricas', syntax: 'Duelo: UEFA vs FIFA · Ingresos 2022-2025 — €20,163M vs US$10,083M · Reservas — €522M vs US$2,699M' },
  { name: 'Ranking', group: 'Actores y poder', note: 'la tabla, escalada al líder', syntax: 'Ranking: Valor de franquicia NFL · Cowboys — US$10,100M · Rams — US$7,600M (+1) · Giants — US$7,300M (−1)' },
  { name: 'Perfil', group: 'Actores y poder', note: 'la ficha del actor central', syntax: 'Perfil: Gianni Infantino · Cargo — Presidente de FIFA · Desde — 2016 · Mandato — hasta 2027 · Sueldo — CHF3.9M' },
  { name: 'Votación', group: 'Actores y poder', note: 'el conteo con su umbral dibujado', syntax: 'Votación: Mundial cada dos años · A favor — 166 · En contra — 22 · Abstención — 23 · Umbral — 138 (dos tercios)' },
  // — Mercado y propiedad
  { name: 'Cotización (tile)', group: 'Mercado y propiedad', note: 'el precio, hoy', syntax: 'Cotización: Ollamani — MX$14.50 · -34.6% · en el año' },
  { name: 'Cotización (track)', group: 'Mercado y propiedad', note: 'el precio arrastrando algo, con umbral', syntax: 'Cotización: On Holding vs Patrimonio de Federer · Umbral — US$1,000M · ago 2025 — US$50.00 · 11 ago 2026 — US$38.78 vs US$1,004M · 12 ago 2026 — US$31.29 vs US$952M' },
  { name: 'Resultados', group: 'Mercado y propiedad', note: 'el estado de resultados', syntax: 'Resultados: Fox Corporation, Q4 fiscal 2026 · Ingresos — US$4,210M (+28%) · Publicidad — US$1,916M (+78%) · Utilidad neta — US$696M' },
  { name: 'Venta', group: 'Mercado y propiedad', note: 'la escritura del traspaso', syntax: 'Venta: Lakers · Precio — US$12,500M · De — Mark Walter · A — Josh Kushner y Bob Iger · Anterior — US$10,000M (2025) · Fecha — Agosto 2026' },
  { name: 'Cadena', group: 'Mercado y propiedad', note: 'la cadena de dueños', syntax: 'Cadena: Lakers · 1979 — Jerry Buss — US$67.5M · 2025 — Mark Walter — US$10,000M · 2026 — Kushner y Iger — US$12,500M' },
  { name: 'Contrato', group: 'Mercado y propiedad', note: 'el term sheet, con "hoy" sobre el plazo', syntax: 'Contrato: Apple TV ↔ MLS · Monto — US$250M por año · Plazo — 2023 a 2032 · Cláusula — salida mutua en 2028' },
  { name: 'Control', group: 'Mercado y propiedad', note: 'el traspaso sin precio revelado', syntax: 'Control: EverPass Media · De — NFL 32 Equity y RedBird · A — DAZN · Incluye — derechos comerciales de Sunday Ticket · Términos — no revelados' },
  { name: 'Alcance', group: 'Mercado y propiedad', note: 'qué cubre y qué deja fuera', syntax: 'Alcance: Sunday Ticket comercial · Incluye — bares y restaurantes · Incluye — plataforma multipantalla · Fuera — hogares (YouTube TV) · Fuera — mercados internacionales' },
  // — Interpretación y geografía
  { name: 'Mapa', group: 'Interpretación y geografía', note: 'los bandos, en geografía real', syntax: 'Mapa: Concacaf · En el comunicado — resto · Sin firmar — MEX' },
  { name: 'Escenarios', group: 'Interpretación y geografía', note: 'lectura de Playbook, vocabulario fijo', syntax: 'Escenarios: Los derechos de la Liga MX · Renueva con Televisa — probable · Se parte en paquetes — posible · Streaming puro — lejano' },
  { name: 'Condiciones', group: 'Interpretación y geografía', note: 'lo que falta para que sea real, vocabulario fijo', syntax: 'Condiciones: Patrocinio The Athletic-Kalshi · Aval de The New York Times Company — pendiente · Litigio estatal resuelto — en disputa · Acuerdo firmado — pendiente' },
  { name: 'Precedentes', group: 'Interpretación y geografía', note: 'quién ya hizo esto y cómo le fue', syntax: 'Precedentes: Ligas que eliminaron su juego de estrellas · NHL — lo cambió por un torneo de países · MLB — lo mantiene con rating a la baja · NBA — tres cambios de formato en diez años' },
  { name: 'Contraste', group: 'Interpretación y geografía', note: 'lo que dice contra lo que mide', syntax: 'Contraste: Enhanced Games, Q2 2026 · Dice — involucró a mil millones de personas · Midió — 4 millones de vistas en vivo · Fuente — su propio reporte trimestral' },
];

// A lead-in paragraph so the automatic elements (scan mark, count-up,
// money highlight) have something real to act on.
export const AUTO_SAMPLE_HTML =
  '<p><strong>La sanción:</strong> el club pagará <strong>US$40 millones</strong> en tres ejercicios, cerca del 12% de su ingreso anual, y la liga retiene otros US$6M en garantías.</p>';

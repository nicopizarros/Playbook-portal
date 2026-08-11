// ————————————————————————————————————————————————————————— El Mapa
// Authoring convention (2026-08-10): a paragraph that reads
//
//   Mapa: Concacaf · En el comunicado — resto · Sin firmar — MEX
//
// renders as a map — the frame's countries drawn as real geography, split
// into labelled groups, with a legend that counts each group for itself.
//
// Built deliberately as a GENERAL device rather than one illustration.
// The geometry behind it is the whole world (lib/data/world-map.json, see
// scripts/build-world-map.ts), so any story that divides a set of
// countries into camps can draw itself: who signed and who did not, who
// hosts and who bid, which markets a rights deal covers, where a league is
// broadcast. The first item picks the frame (what gets drawn and where the
// map is centred), every item after it is a group.
//
//   Frame:   mundo · concacaf · conmebol · uefa · ofc · europa · áfrica ·
//            asia · oceanía · norteamérica · sudamérica · auto
//            ("auto" frames exactly the countries the groups name, which
//            is what to use for a set that is not one of the above.)
//   Groups:  "Etiqueta — MEX, USA, CAN" with ISO3 codes, or
//            "Etiqueta — resto" for every framed country no other group
//            claimed. One to three groups.
//
// The groups render in a fixed visual order that encodes the most common
// shape of these stories: the FIRST group is the filled mass, the SECOND
// is hollow with a heavy outline (the exception, the holdout, the one that
// is missing), the third is a mid tint. So "everyone except X" is written
// as `Grupo — resto · X — MEX`, and X reads as the hole in the map.
//
// Countries too small to draw at this scale (half of Concacaf is Caribbean
// islands) are dots rather than shapes — see the build script's comment.
// Same contract as every other device: plain text, parsed server-side,
// null when malformed so the paragraph stays readable prose.

import world from './data/world-map.json';

type CountryEntry = { n: string; c: [number, number]; p?: number[][][]; r?: string };
const COUNTRIES = world.countries as unknown as Record<string, CountryEntry>;
const FRAMES = world.frames as unknown as Record<string, string[]>;

// Spanish (and a couple of English) names for the frames, mapped onto the
// dataset's own keys. Continent keys come from Natural Earth, so they are
// English; nobody authoring in Spanish should have to know that.
const FRAME_ALIASES: Record<string, string[]> = {
  mundo: ['mundo'],
  world: ['mundo'],
  global: ['mundo'],
  concacaf: ['concacaf'],
  conmebol: ['conmebol'],
  uefa: ['uefa'],
  ofc: ['ofc'],
  oceania: ['oceania'],
  europa: ['europe'],
  europe: ['europe'],
  africa: ['africa'],
  asia: ['asia'],
  norteamerica: ['north america'],
  'america del norte': ['north america'],
  sudamerica: ['south america'],
  'america del sur': ['south america'],
  latinoamerica: ['south america', 'north america'],
  america: ['north america', 'south america'],
};

export type MapGroup = { label: string; codes: string[] };
export type ArticleMap = { frame: string; groups: MapGroup[]; codes: string[] };

const MAX_GROUPS = 3;

// Accent-insensitive key for frame lookup: "áfrica" and "africa" are the
// same frame, and an editor should not have to think about it.
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function codesFrom(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map(code => code.trim().toUpperCase())
    .filter(code => /^[A-Z]{3}$/.test(code));
}

const ITEM_SEP = /\s+·\s+/;
const KV_RE = /^(.*?)\s+[—–-]\s+([\s\S]+)$/;

export function parseMap(raw: string): ArticleMap | null {
  const items = raw
    .replace(/<[^>]+>/g, '')
    .split(ITEM_SEP)
    .map(item => item.trim())
    .filter(Boolean);
  if (items.length < 2) return null;

  const [frameItem, ...groupItems] = items;
  const frameKey = fold(frameItem);
  const isAuto = frameKey === 'auto';
  const frameKeys = FRAME_ALIASES[frameKey];
  if (!isAuto && !frameKeys) return null;

  const groups: MapGroup[] = [];
  let restIndex = -1;
  for (const item of groupItems.slice(0, MAX_GROUPS)) {
    const kv = item.match(KV_RE);
    if (!kv) return null;
    const label = kv[1].trim();
    const value = kv[2].trim();
    if (!label) return null;
    if (fold(value) === 'resto') {
      // Two "resto" groups would each claim what the other left over;
      // there is no sensible reading, so the paragraph stays text.
      if (restIndex !== -1 || isAuto) return null;
      restIndex = groups.length;
      groups.push({ label, codes: [] });
      continue;
    }
    const codes = codesFrom(value).filter(code => COUNTRIES[code]);
    if (!codes.length) return null;
    groups.push({ label, codes });
  }
  if (!groups.length) return null;

  const framed = isAuto
    ? [...new Set(groups.flatMap(group => group.codes))]
    : [...new Set(frameKeys!.flatMap(key => FRAMES[key] || []))];
  if (framed.length < 2) return null;

  if (restIndex !== -1) {
    const claimed = new Set(groups.flatMap(group => group.codes));
    groups[restIndex].codes = framed.filter(code => !claimed.has(code));
    if (!groups[restIndex].codes.length) return null;
  }

  // A group naming countries outside the frame would draw them off-canvas;
  // widening the frame to fit is the friendlier reading, and it is what
  // "auto" does anyway.
  const codes = [...new Set([...framed, ...groups.flatMap(group => group.codes)])];
  return { frame: isAuto ? 'auto' : frameKey, groups, codes };
}

// ————————————————————————————————————————————————————————— Projection
// Equirectangular with a standard parallel at the frame's mid-latitude:
// x = lon·cos(lat0), y = -lat. Simple, dependency-free, and honest at the
// scale of a single confederation, which is what this device is for. A
// world frame degenerates to plain plate carrée, the projection every
// reader has already seen on a wall.
const VIEW_W = 1000;
const MIN_H = 420;
const MAX_H = 760;
const PAD = 26;

type Projected = { x: number; y: number };

function projector(lat0: number, shift: boolean) {
  const k = Math.cos((lat0 * Math.PI) / 180) || 1;
  return ([lon, lat]: number[]): Projected => ({
    x: (shift && lon < 0 ? lon + 360 : lon) * k,
    y: -lat,
  });
}

// A frame that straddles the antimeridian (Oceania) has a raw longitude
// span of nearly 360° and would draw the entire planet to fit Fiji and
// Samoa in the same picture. Shifting negatives by +360 makes that frame
// contiguous.
//
// The shift is only correct for a frame clustered AROUND the antimeridian,
// and it is actively wrong for any other: it tears apart every country
// that straddles the prime meridian instead (the United Kingdom becomes a
// black bar across the whole canvas, measured), and it silently rotates a
// world map by 180°. Requiring the shifted span to fit inside a hemisphere
// rules both out — a frame that compact cannot also contain longitudes
// near zero, since those stay near zero under the shift.
function needsShift(lons: number[]): boolean {
  const span = (values: number[]) => Math.max(...values) - Math.min(...values);
  const shifted = span(lons.map(lon => (lon < 0 ? lon + 360 : lon)));
  return shifted < span(lons) && shifted <= 180;
}

function pointsOf(code: string): number[][] {
  const entry = COUNTRIES[code];
  if (!entry) return [];
  return entry.p ? entry.p.flat() : [entry.c];
}

function pathFor(rings: number[][][], project: (p: number[]) => Projected, sx: number, sy: number, ox: number, oy: number): string {
  return rings
    .map(ring => {
      const d = ring
        .map((point, i) => {
          const p = project(point);
          return `${i ? 'L' : 'M'}${(p.x * sx + ox).toFixed(1)} ${(p.y * sy + oy).toFixed(1)}`;
        })
        .join('');
      return `${d}Z`;
    })
    .join('');
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMap(map: ArticleMap): string | null {
  const drawn = map.codes.filter(code => COUNTRIES[code]);
  if (drawn.length < 2) return null;

  const all = drawn.flatMap(pointsOf);
  if (!all.length) return null;
  const shift = needsShift(all.map(p => p[0]));
  const lats = all.map(p => p[1]);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
  const project = projector(lat0, shift);

  const projected = all.map(project);
  const minX = Math.min(...projected.map(p => p.x));
  const maxX = Math.max(...projected.map(p => p.x));
  const minY = Math.min(...projected.map(p => p.y));
  const maxY = Math.max(...projected.map(p => p.y));
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const height = Math.min(MAX_H, Math.max(MIN_H, ((VIEW_W - PAD * 2) * spanY) / spanX + PAD * 2));
  const scale = Math.min((VIEW_W - PAD * 2) / spanX, (height - PAD * 2) / spanY);
  const offsetX = (VIEW_W - spanX * scale) / 2 - minX * scale;
  const offsetY = (height - spanY * scale) / 2 - minY * scale;

  // Group index per country; anything framed but unclaimed renders as
  // context so the reader can see the whole region, not only the camps.
  const groupOf = new Map<string, number>();
  map.groups.forEach((group, index) => {
    for (const code of group.codes) if (!groupOf.has(code)) groupOf.set(code, index);
  });

  // Dots after shapes, and the marked groups after the unmarked ones, so a
  // highlighted island is never hidden under a neighbour's landmass.
  const ordered = drawn
    .slice()
    .sort((a, b) => (groupOf.get(a) ?? -1) - (groupOf.get(b) ?? -1));

  const shapes: string[] = [];
  const dots: string[] = [];
  for (const code of ordered) {
    const entry = COUNTRIES[code];
    const index = groupOf.get(code);
    const cls = index === undefined ? 'lect-map-base' : `lect-map-g${index + 1}`;
    const title = `<title>${esc(entry.n)}</title>`;
    if (entry.p) {
      shapes.push(
        `<path class="lect-map-area ${cls}" d="${pathFor(entry.p, project, scale, scale, offsetX, offsetY)}">${title}</path>`,
      );
    } else {
      const p = project(entry.c);
      dots.push(
        `<circle class="lect-map-dot ${cls}" cx="${(p.x * scale + offsetX).toFixed(1)}" cy="${(p.y * scale + offsetY).toFixed(1)}" r="5.5">${title}</circle>`,
      );
    }
  }

  const legend = map.groups
    .map(
      (group, index) =>
        `<span class="lect-map-key lect-map-g${index + 1}">` +
        `<span class="lect-map-swatch" aria-hidden="true"></span>` +
        `<span class="lect-map-key-label">${esc(group.label)}</span>` +
        `<span class="lect-map-key-count">${group.codes.length}</span></span>`,
    )
    .join('');

  const described = map.groups.map(group => `${group.label}: ${group.codes.length}`).join('. ');

  return (
    `<figure class="lect-device lect-map reveal" role="group" aria-label="Mapa. ${esc(described)}">` +
    `<span class="lect-device-label">El mapa</span>` +
    `<svg class="lect-map-svg" viewBox="0 0 ${VIEW_W} ${height.toFixed(0)}" role="img" ` +
    `aria-label="${esc(described)}" preserveAspectRatio="xMidYMid meet">` +
    `<g class="lect-map-shapes">${shapes.join('')}</g>` +
    `<g class="lect-map-dots">${dots.join('')}</g>` +
    `</svg>` +
    `<figcaption class="lect-map-legend">${legend}</figcaption>` +
    `</figure>`
  );
}

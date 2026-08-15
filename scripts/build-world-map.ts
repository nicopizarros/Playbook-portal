// Builds lib/data/world-map.json, the geometry behind the "Mapa:" article
// device (see lib/article-devices.ts). Run by hand, never at build time —
// the output is committed, because the two inputs live on the public
// internet and the app must not depend on reaching them:
//
//   ne_110m_admin_0_countries.geojson   Natural Earth 1:110m admin-0, via
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
//   country-codes-lat-long-alpha3.json  ISO3 → lat/lon for every code, via
//     https://raw.githubusercontent.com/eesur/country-codes-lat-long/master/country-codes-lat-long-alpha3.json
//
// Usage: npx tsx scripts/build-world-map.ts <dir-with-both-files>
//
// Natural Earth 110m carries 177 polygons, which is every country big
// enough to read at article scale and none of the ~60 territories that
// are not. Those are exactly the ones football cares about (half of
// Concacaf is Caribbean islands), so the output pairs each ISO3 with a
// polygon when one exists and a point always. The device draws whichever
// it has: a shape for Mexico, a dot for Anguilla. That is not a
// degradation, it is the correct cartography at this size — a 110m
// Anguilla polygon would be a third of a pixel.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type Ring = number[][];
type Feature = {
  properties: Record<string, string | number | null>;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } | null;
};

// Coordinates are rounded to 2 decimals (~1 km at the equator, well under
// one pixel at any size this device renders) and rings under this many
// points, or smaller than this share of their country's largest ring, are
// dropped: at article scale they are noise that costs bytes.
const PRECISION = 2;
const MIN_RING_POINTS = 5;
const MIN_RING_SHARE = 0.02;

const round = (n: number) => Number(n.toFixed(PRECISION));

// Shoelace area in degrees². Only ever compared against other rings of the
// same country, so no equal-area correction is needed.
function ringArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return Math.abs(sum / 2);
}

function ringsOf(feature: Feature): Ring[] {
  const geometry = feature.geometry;
  if (!geometry) return [];
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as number[][][]]
      : (geometry.coordinates as number[][][][]);
  // Outer ring only (index 0): holes are invisible at this scale and the
  // device fills each ring independently, so keeping them would punch
  // nothing and cost bytes.
  return polygons.map(polygon => polygon[0]).filter(Boolean) as Ring[];
}

function simplify(rings: Ring[]): Ring[] {
  const scored = rings
    .map(ring => ({ ring, area: ringArea(ring) }))
    .filter(r => r.ring.length >= MIN_RING_POINTS)
    .sort((a, b) => b.area - a.area);
  if (!scored.length) return [];
  const biggest = scored[0].area;
  return scored
    .filter(r => r.area >= biggest * MIN_RING_SHARE)
    .map(r => r.ring.map(([lon, lat]) => [round(lon), round(lat)]));
}

// Area-weighted centroid of a country's rings, so the dot for a country
// that also has a polygon lands inside it (used for the label anchor and
// for the frame fit when a country is point-only).
function centroidOf(rings: Ring[]): [number, number] | null {
  let totalArea = 0;
  let x = 0;
  let y = 0;
  for (const ring of rings) {
    const area = ringArea(ring);
    if (!area) continue;
    let cx = 0;
    let cy = 0;
    for (const [lon, lat] of ring) {
      cx += lon;
      cy += lat;
    }
    x += (cx / ring.length) * area;
    y += (cy / ring.length) * area;
    totalArea += area;
  }
  return totalArea ? [round(x / totalArea), round(y / totalArea)] : null;
}

// The four Caribbean codes the centroid dataset is missing, all of them
// Concacaf members, so the very first map this device draws needs them.
const EXTRA_POINTS: Record<string, [number, number]> = {
  BES: [-68.26, 12.2], // Bonaire
  CUW: [-68.99, 12.17], // Curaçao
  MAF: [-63.08, 18.08], // Saint-Martin
  SXM: [-63.05, 18.03], // Sint Maarten
};

// UEFA's four British members are football associations, not countries:
// they have no ISO3 code and no polygon of their own inside GBR. They get
// Playbook-local codes and a point at each association's seat, which is
// the honest way to draw them — GBR renders as one shape underneath and
// the four dots sit on it.
const ASSOCIATION_POINTS: Record<string, { name: string; point: [number, number] }> = {
  ENG: { name: 'Inglaterra', point: [-0.28, 51.56] },
  SCO: { name: 'Escocia', point: [-3.2, 55.95] },
  WAL: { name: 'Gales', point: [-3.18, 51.48] },
  NIR: { name: 'Irlanda del Norte', point: [-5.93, 54.6] },
};

// Natural Earth leaves ISO_A3 as "-99" for territories whose status is
// disputed, so the ones football recognises as members have to be picked
// up by Natural Earth's own code instead. Kosovo is the live case: a UEFA
// and FIFA member since 2016, and the only UEFA member with no ISO3.
const NE_CODE_ALIASES: Record<string, string> = { KOS: 'XKX' };

// ————————————————————————————————————————————————————————————— Frames
// A frame is a named set of codes the device can draw without the editor
// listing them. Continents come out of Natural Earth's own CONTINENT
// field; the football ones are enumerated, because no dataset ships
// confederation membership and it is the thing Playbook maps most.
//
// Concacaf's 41 are its three blocks exactly as the confederation counts
// them: NAFU 3, UNCAF 7, CFU 31 (concacaf.com/inside-concacaf).
const NAFU = ['CAN', 'MEX', 'USA'];
const UNCAF = ['BLZ', 'CRI', 'SLV', 'GTM', 'HND', 'NIC', 'PAN'];
const CFU = [
  'AIA', 'ATG', 'ABW', 'BHS', 'BRB', 'BMU', 'BES', 'VGB', 'CYM', 'CUB',
  'CUW', 'DMA', 'DOM', 'GUF', 'GRD', 'GLP', 'GUY', 'HTI', 'JAM', 'MTQ',
  'MSR', 'PRI', 'MAF', 'KNA', 'LCA', 'VCT', 'SXM', 'SUR', 'TTO', 'TCA',
  'VIR',
];

const CONMEBOL = ['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU', 'PRY', 'PER', 'URY', 'VEN'];

const OFC = [
  'ASM', 'COK', 'FJI', 'KIR', 'NCL', 'NZL', 'PNG', 'WSM', 'SLB', 'TON',
  'TUV', 'VUT', 'PYF',
];

const UEFA = [
  'ALB', 'AND', 'ARM', 'AUT', 'AZE', 'BLR', 'BEL', 'BIH', 'BGR', 'HRV',
  'CYP', 'CZE', 'DNK', 'ENG', 'EST', 'FRO', 'FIN', 'FRA', 'GEO', 'DEU',
  'GIB', 'GRC', 'HUN', 'ISL', 'ISR', 'ITA', 'KAZ', 'XKX', 'LVA', 'LIE',
  'LTU', 'LUX', 'MLT', 'MDA', 'MNE', 'NLD', 'MKD', 'NIR', 'NOR', 'POL',
  'PRT', 'IRL', 'ROU', 'RUS', 'SMR', 'SCO', 'SRB', 'SVK', 'SVN', 'ESP',
  'SWE', 'CHE', 'TUR', 'UKR', 'WAL',
];

// CAF's 54, all of them FIFA members. Réunion is a CAF associate and
// Zanzibar an affiliate; neither is a FIFA member, so neither votes and
// neither is listed. Note CAF the confederation and CAF the ISO3 code for
// the Central African Republic collide — see lib/article-map.ts, which
// resolves a group token as a country first and a confederation second.
const CAF = [
  'DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD',
  'COM', 'COG', 'COD', 'DJI', 'EGY', 'GNQ', 'ERI', 'SWZ', 'ETH', 'GAB',
  'GMB', 'GHA', 'GIN', 'GNB', 'CIV', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG',
  'MWI', 'MLI', 'MRT', 'MUS', 'MAR', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA',
  'STP', 'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SSD', 'SDN', 'TZA', 'TGO',
  'TUN', 'UGA', 'ZMB', 'ZWE',
];

// AFC's 47. Australia moved across from the OFC in 2006 and is an AFC
// member. Northern Mariana Islands is the one AFC member FIFA has not
// admitted, so it is drawn but does not vote (see NON_FIFA below).
const AFC = [
  'AFG', 'AUS', 'BHR', 'BGD', 'BTN', 'BRN', 'KHM', 'CHN', 'TWN', 'GUM',
  'HKG', 'IND', 'IDN', 'IRN', 'IRQ', 'JPN', 'JOR', 'KWT', 'KGZ', 'LAO',
  'LBN', 'MAC', 'MYS', 'MDV', 'MNG', 'MMR', 'NPL', 'PRK', 'MNP', 'OMN',
  'PAK', 'PSE', 'PHL', 'QAT', 'SAU', 'SGP', 'KOR', 'LKA', 'SYR', 'TJK',
  'THA', 'TLS', 'TKM', 'ARE', 'UZB', 'VNM', 'YEM',
];

// ————————————————————————————————————————————— FIFA voting membership
// A confederation's roster and FIFA's electorate are not the same set:
// the six confederations have 218 members between them, FIFA has 211.
// The gap is nine associations that play in a confederation without
// being FIFA members, so they appear on a map and never on a ballot.
//
// This matters because a governance map's legend counts its own codes,
// and a story about an election is counting votes. `lib/article-map.ts`
// expands a confederation named inside a GROUP to its FIFA members only,
// which is what keeps a legend that says 136 from sitting next to prose
// that says 136. Framing is unaffected: `Mapa: concacaf` still draws all
// 41, because drawing a region should show the whole region.
const NON_FIFA = [
  'BES', 'SXM', 'GUF', 'GLP', 'MTQ', 'MAF', // Concacaf: 41 members, 35 vote
  'KIR', 'TUV', //                             OFC: 13 members, 11 vote
  'MNP', //                                    AFC: 47 members, 46 vote
];

// FIFA members whose voting rights are currently suspended. They are
// members, so they are NOT in NON_FIFA, but they cannot vote, so a map of
// an electorate must leave them out of every camp — the BBC's own map of
// this fight counts 210 for exactly this reason. Kept separate from
// NON_FIFA because suspension is reversible and the fix on the day it
// lifts is deleting one line.
const SUSPENDED = ['NPL']; // Nepal, suspended as of August 2026

// Every frame's expected size, asserted below: a typo that silently drops
// a country would otherwise ship as a map that quietly undercounts, which
// is the one failure mode a map device cannot be allowed to have.
const FRAME_SIZES: Record<string, number> = {
  concacaf: 41,
  conmebol: 10,
  uefa: 55,
  ofc: 13,
  caf: 54,
  afc: 47,
};

// The six confederations must partition FIFA's electorate exactly. If a
// federation is ever added, moved or dropped, this is the assertion that
// catches it before a map ships a wrong tally.
const FIFA_TOTAL = 211;
const FIFA_VOTING = 210;

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: tsx scripts/build-world-map.ts <dir-with-source-files>');
    process.exitCode = 1;
    return;
  }

  const geo = JSON.parse(
    await readFile(join(dir, 'ne_110m_admin_0_countries.geojson'), 'utf-8'),
  ) as { features: Feature[] };
  const centroidRaw = JSON.parse(await readFile(join(dir, 'centroids.json'), 'utf-8')) as
    | { ref_country_codes: { alpha3: string; latitude: number; longitude: number }[] }
    | { alpha3: string; latitude: number; longitude: number }[];
  const centroidList = Array.isArray(centroidRaw) ? centroidRaw : centroidRaw.ref_country_codes;

  type Country = { n: string; c: [number, number]; p?: number[][][]; r?: string };
  const countries: Record<string, Country> = {};
  const continents: Record<string, string[]> = {};

  for (const feature of geo.features) {
    const props = feature.properties;
    const rawCode = String(props.ISO_A3_EH || props.ISO_A3 || '').toUpperCase();
    const neCode = String(props.ADM0_A3 || '').toUpperCase();
    const code = /^[A-Z]{3}$/.test(rawCode) ? rawCode : NE_CODE_ALIASES[neCode] || '';
    if (!/^[A-Z]{3}$/.test(code)) continue;
    const rings = simplify(ringsOf(feature));
    const centroid = centroidOf(ringsOf(feature));
    if (!centroid) continue;
    const name = String(props.NAME_ES || props.NAME || code);
    const continent = String(props.CONTINENT || '').toLowerCase();
    countries[code] = { n: name, c: centroid, ...(rings.length ? { p: rings } : {}), r: continent };
    if (continent) (continents[continent] ||= []).push(code);
  }

  // Point-only territories: everything the centroid table knows that
  // Natural Earth 110m does not draw.
  for (const entry of centroidList) {
    const code = entry.alpha3?.toUpperCase();
    if (!code || countries[code]) continue;
    countries[code] = {
      n: String((entry as { country?: string }).country || code),
      c: [round(entry.longitude), round(entry.latitude)],
    };
  }
  for (const [code, point] of Object.entries(EXTRA_POINTS)) {
    if (!countries[code]) countries[code] = { n: code, c: point };
    else countries[code].c = point;
  }
  for (const [code, { name, point }] of Object.entries(ASSOCIATION_POINTS)) {
    countries[code] = { n: name, c: point };
  }

  // Spanish names for the Concacaf territories the sources label in
  // English or French; every other name comes from Natural Earth's NAME_ES.
  const NAMES_ES: Record<string, string> = {
    AIA: 'Anguila', ATG: 'Antigua y Barbuda', ABW: 'Aruba', BHS: 'Bahamas',
    BRB: 'Barbados', BMU: 'Bermudas', BES: 'Bonaire', VGB: 'Islas Vírgenes Británicas',
    CYM: 'Islas Caimán', CUW: 'Curazao', DMA: 'Dominica', GUF: 'Guayana Francesa',
    GRD: 'Granada', GLP: 'Guadalupe', MTQ: 'Martinica', MSR: 'Montserrat',
    PRI: 'Puerto Rico', MAF: 'San Martín', KNA: 'San Cristóbal y Nieves',
    LCA: 'Santa Lucía', VCT: 'San Vicente y las Granadinas', SXM: 'Sint Maarten',
    TCA: 'Islas Turcas y Caicos', VIR: 'Islas Vírgenes de EE. UU.',
  };
  for (const [code, name] of Object.entries(NAMES_ES)) {
    if (countries[code]) countries[code].n = name;
  }

  const frames: Record<string, string[]> = {
    concacaf: [...NAFU, ...UNCAF, ...CFU],
    conmebol: CONMEBOL,
    uefa: UEFA,
    ofc: OFC,
    caf: CAF,
    afc: AFC,
  };
  // Antarctica is dropped from the world frame: it owns a quarter of any
  // equirectangular canvas and never carries a story.
  frames.mundo = Object.keys(countries).filter(code => countries[code].p && code !== 'ATA');
  for (const [continent, codes] of Object.entries(continents)) {
    if (continent === 'antarctica' || continent === 'seven seas (open ocean)') continue;
    frames[continent] = codes;
  }

  const problems: string[] = [];
  for (const [frame, expected] of Object.entries(FRAME_SIZES)) {
    if (frames[frame].length !== expected) {
      problems.push(`frame ${frame}: ${frames[frame].length} códigos, se esperaban ${expected}`);
    }
    const unknown = frames[frame].filter(code => !countries[code]);
    if (unknown.length) problems.push(`frame ${frame}: sin geometría ni punto → ${unknown.join(', ')}`);
    const dupes = frames[frame].filter((c, i) => frames[frame].indexOf(c) !== i);
    if (dupes.length) problems.push(`frame ${frame}: repetidos → ${dupes.join(', ')}`);
  }

  // The six confederations must be disjoint and must cover FIFA's
  // electorate exactly once. A federation listed twice would be counted
  // twice by any legend that adds two confederations together, and one
  // listed nowhere would silently shrink the electorate.
  const CONFEDERATIONS = ['concacaf', 'conmebol', 'uefa', 'ofc', 'caf', 'afc'];
  const seen = new Map<string, string>();
  for (const key of CONFEDERATIONS) {
    for (const code of frames[key]) {
      const already = seen.get(code);
      if (already) problems.push(`${code} está en ${already} y en ${key}`);
      else seen.set(code, key);
    }
  }
  const nonFifaOutside = NON_FIFA.filter(code => !seen.has(code));
  if (nonFifaOutside.length) {
    problems.push(`NON_FIFA fuera de toda confederación → ${nonFifaOutside.join(', ')}`);
  }
  const members = [...seen.keys()].filter(code => !NON_FIFA.includes(code));
  if (members.length !== FIFA_TOTAL) {
    problems.push(`miembros FIFA: ${members.length} federaciones, se esperaban ${FIFA_TOTAL}`);
  }
  const outside = SUSPENDED.filter(code => !members.includes(code));
  if (outside.length) problems.push(`suspendidas que no son miembros → ${outside.join(', ')}`);
  const voters = members.filter(code => !SUSPENDED.includes(code));
  if (voters.length !== FIFA_VOTING) {
    problems.push(`electorado FIFA: ${voters.length} con voto, se esperaban ${FIFA_VOTING}`);
  }

  if (problems.length) {
    console.error('[world-map] no se escribió nada:\n  ' + problems.join('\n  '));
    process.exitCode = 1;
    return;
  }

  const out = { countries, frames, nonFifa: NON_FIFA, suspended: SUSPENDED };
  const path = join(process.cwd(), 'lib/data/world-map.json');
  await writeFile(path, JSON.stringify(out));
  const withShapes = Object.values(countries).filter(c => c.p).length;
  console.log(
    `[world-map] ${Object.keys(countries).length} códigos (${withShapes} con polígono), ` +
      `${Object.keys(frames).length} marcos, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB → ${path}`,
  );
}

main().catch(err => {
  console.error('[world-map] falló:', err);
  process.exitCode = 1;
});

import { CONFEDERATIONS, FEDERATIONS, ELECTION, buckets, sides, defectors, lastMovement, BUCKET_LABEL } from './lib/data/fifa-election';
const b = buckets();
console.log('BUCKETS');
for (const x of b) console.log('  ', BUCKET_LABEL[x.bucket].padEnd(34), x.votes);
console.log('  SUM =', b.reduce((t,x)=>t+x.votes,0), '(must be', ELECTION.totalVotes + ')');
console.log('CONFED SUM =', CONFEDERATIONS.reduce((t,c)=>t+c.votes,0));
console.log('SIDES', JSON.stringify(sides()));
console.log('spoke =', FEDERATIONS.length);
console.log('lastMovement =', lastMovement());
console.log('defectors =', defectors().map(f=>f.name).join(' · '));
const codes = FEDERATIONS.map(f=>f.code);
console.log('dupes:', codes.filter((c,i)=>codes.indexOf(c)!==i).join(',') || 'none');
// join check against the map
import map from './lib/data/world-map.json';
const known = new Set(Object.keys((map as any).countries));
console.log('codes NOT in world-map.json:', codes.filter(c=>!known.has(c)).join(',') || 'none');

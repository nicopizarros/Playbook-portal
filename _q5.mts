import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.POSTGRES_URL!);
const f = await sql`select id,title,date_formatted from articles where featured=true and status='published'`;
console.log('FEATURED rows:', f.length); for (const r of f as any[]) console.log('  ', r.date_formatted, r.id);
const p = await sql`select id,priority,reading_time,tags_vertical,tags_scope,tags_sport from articles where id in ('infantino-desafia-a-montagliani-y-reparte-fondos-de-fifa-en-el-caribe-mientras-la-coalicion-que-lo-quiere-fuera-se-resquebraja','uefa-y-concacaf-negocian-una-nations-league-conjunta-contra-infantino-y-le-disputan-a-mexico-a-punta-de-calendario','concacaf-firma-contra-infantino-y-mexico-se-queda-fuera-del-comunicado-regional')`;
for (const r of p as any[]) console.log(JSON.stringify(r));
const dup = await sql`select id from articles where source_url ilike '%gibraltarfa%' or source_url ilike '%77th_FIFA%'`;
console.log('dedupe check:', dup.length);

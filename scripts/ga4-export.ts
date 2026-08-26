// Dumps the five GA4 reports the dashboard needs as JSON on stdout, so the
// Python builder can consume them without reimplementing Google's JWT auth.
// lib/ga4.ts already does the signing; this is a thin CLI around it.
//
// Usage: npx tsx --env-file=.env.local scripts/ga4-export.ts > ga4.json
import { isConfigured, runReport } from '../lib/ga4';

const START = process.env.GA4_START || '2026-01-01';
const END = process.env.GA4_END || 'today';

async function report(dims: string[], mets: string[], limit = 100) {
  const rows = await runReport({
    dateRanges: [{ startDate: START, endDate: END }],
    dimensions: dims.map(name => ({ name })),
    metrics: mets.map(name => ({ name })),
    limit,
  });
  return rows.map(r => [
    ...r.dimensionValues.map(d => d.value),
    ...r.metricValues.map(m => m.value),
  ]);
}

async function main() {
  if (!isConfigured()) {
    console.error('GA4 no está configurado');
    process.exit(1);
  }
  const out = {
    resumen: await report(['yearMonth'],
      ['activeUsers', 'newUsers', 'sessions', 'screenPageViews',
       'averageSessionDuration', 'engagementRate']),
    canales: await report(['yearMonth', 'sessionDefaultChannelGroup'],
      ['sessions', 'activeUsers', 'screenPageViews', 'engagementRate']),
    paginas: await report(['yearMonth', 'pagePath'],
      ['screenPageViews', 'activeUsers', 'userEngagementDuration'], 25),
    dispositivos: await report(['yearMonth', 'deviceCategory'],
      ['activeUsers', 'sessions', 'engagementRate']),
    eventos: await report(['yearMonth', 'eventName'], ['eventCount', 'activeUsers'], 40),
  };
  console.log(JSON.stringify(out, null, 1));
}
main();

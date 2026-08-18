// Vercel Cron target (see vercel.json's `crons`): re-syncs the full
// reader list to Google Sheets on a schedule, so the reading-activity
// column doesn't just permanently read 0 the way the per-signup append in
// lib/google-sheets.ts's appendReaderRow does on its own -- see that
// file's syncAllReadersToSheet for why this is a full overwrite, not an
// incremental update.
//
// Auth: Vercel signs every cron invocation with `Authorization: Bearer
// ${CRON_SECRET}` automatically once CRON_SECRET is set (its own
// documented mechanism, see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs)
// -- this route rejects anything else, so it can't be triggered by a
// stray public request to re-run a Sheets write on demand.
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAllReaders } from '@/lib/data/readers';
import { syncAllReadersToSheet, isConfigured } from '@/lib/google-sheets';

function constantTimeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';
  if (!secret || !constantTimeEqual(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isConfigured()) {
    // Not an error: the Sheets integration hasn't been set up yet
    // (READERS_SHEET_ID unset), same graceful "nothing to do" posture as
    // appendReaderRow. The cron keeps firing on schedule either way --
    // it starts doing real work the moment the env var lands, no
    // redeploy or vercel.json change needed.
    return NextResponse.json({ synced: false, reason: 'not configured' });
  }

  const readers = await getAllReaders();
  const result = await syncAllReadersToSheet(readers);

  if (!result.ok) {
    return NextResponse.json({ synced: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ synced: true, count: readers.length });
}

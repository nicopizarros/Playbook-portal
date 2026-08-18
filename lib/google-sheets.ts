// Appends a row to a Google Sheet whenever a new reader account is
// created (auth.ts's `createUser` event for Google sign-ups,
// lib/actions/reader-auth.ts for email+password sign-ups) — 2026-08-02,
// requested so the team can see new registrations land somewhere they
// already check, not just the admin "Lectores" tab.
//
// Reuses the exact same service-account credential as lib/ga4.ts
// (GA4_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY) rather than a separate one: a
// service account's key can mint a token for any scope its Google Cloud
// project has the corresponding API enabled for, so the same key that
// signs GA4-scoped tokens there can sign Sheets-scoped tokens here. Two
// setup steps this still needs, neither of them code: the Sheets API
// enabled on that same Google Cloud project (separate opt-in from the
// Analytics Data API GA4 already enabled), and the target spreadsheet
// shared with that service account's email as an Editor -- Sheets access
// is per-document sharing, not governed by the GA4 property permissions
// grant at all.
import crypto from 'crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
// First tab of the spreadsheet, whatever it's named -- avoids hardcoding
// a sheet/tab name the user might rename; Sheets API accepts a bare
// column range like this as "first sheet, columns A:E".
const APPEND_RANGE = 'A:E';

export function isConfigured() {
  return !!(
    process.env.READERS_SHEET_ID &&
    process.env.GA4_SERVICE_ACCOUNT_EMAIL &&
    process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Near-identical to lib/ga4.ts's getAccessToken -- same signing approach,
// different scope/audience -- kept as its own copy rather than a shared
// helper because the two callers' failure handling differs enough
// (this one must never throw into a signup flow, see appendReaderRow
// below) that sharing the function would mean threading that distinction
// through an extra parameter for one call site each.
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: process.env.GA4_SERVICE_ACCOUNT_EMAIL,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const privateKey = (process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY as string).replace(/\\n/g, '\n');
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`No se pudo obtener el token de Sheets (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

export type ReaderSignupRow = {
  createdAt: Date;
  email: string;
  name: string | null;
  authMethod: 'google' | 'password';
  totalReads: number;
};

const dateTimeFmt = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// Best-effort, never throws: a Sheets outage or a not-yet-configured
// credential must never block or fail an actual signup. Callers fire this
// and don't await its result for anything but logging -- same posture as
// lib/actions/editor-auth.ts's sendEditorInvitationEmail degrading to a
// copyable link instead of failing the invite.
//
// totalReads is always 0 at signup time (a reader hasn't read anything
// yet) -- this is a point-in-time append, not a live sync. The daily cron
// below (syncAllReadersToSheet, app/api/cron/sync-readers-sheet) is what
// keeps reading-activity numbers from going stale; this function's job is
// just "a new signup shows up in the sheet right away", not "the sheet is
// always accurate".
export async function appendReaderRow(row: ReaderSignupRow): Promise<void> {
  if (!isConfigured()) return;

  try {
    const accessToken = await getAccessToken();
    const spreadsheetId = process.env.READERS_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${APPEND_RANGE}:append?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: [[
          dateTimeFmt.format(row.createdAt),
          row.email,
          row.name || '',
          row.authMethod === 'google' ? 'Google' : 'Correo y contraseña',
          row.totalReads,
        ]],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[google-sheets] append respondió ${res.status}: ${body.slice(0, 300)}`);
    }
  } catch (err) {
    console.error('[google-sheets] no se pudo escribir la fila:', (err as Error).message);
  }
}

const HEADER_ROW = ['Fecha de registro', 'Correo', 'Nombre', 'Método', 'Lecturas totales'];
// Generous enough that a full re-sync always overwrites every row a
// previous, larger sync might have left behind -- cleared before every
// write rather than computed exactly, since knowing the previous sync's
// row count would mean persisting extra state this doesn't otherwise need.
const CLEAR_RANGE = 'A1:Z10000';

export type ReaderSheetRow = {
  createdAt: Date;
  email: string;
  name: string | null;
  authMethod: 'google' | 'password';
  totalReads: number;
};

// Full-snapshot re-sync, not an append: clears the sheet and rewrites
// every reader with a current totalReads, called on a schedule
// (app/api/cron/sync-readers-sheet) rather than per-signup. This is what
// keeps the reading-activity column from just permanently showing 0 the
// way a per-signup append would (see appendReaderRow above). The two
// don't conflict in practice -- a signup between two scheduled runs shows
// up immediately via appendReaderRow, and the next scheduled run
// overwrites the whole sheet (that signup included, now with an accurate
// count) rather than trying to reconcile individual rows by email, which
// would break the moment someone manually edits the sheet.
export async function syncAllReadersToSheet(readers: ReaderSheetRow[]): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) return { ok: false, error: 'READERS_SHEET_ID (o el service account) no está configurada.' };

  try {
    const accessToken = await getAccessToken();
    const spreadsheetId = process.env.READERS_SHEET_ID;
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values`;

    const clearRes = await fetch(`${base}/${CLEAR_RANGE}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!clearRes.ok) {
      const body = await clearRes.text().catch(() => '');
      return { ok: false, error: `clear respondió ${clearRes.status}: ${body.slice(0, 300)}` };
    }

    const rows = readers.map(r => [
      dateTimeFmt.format(r.createdAt),
      r.email,
      r.name || '',
      r.authMethod === 'google' ? 'Google' : 'Correo y contraseña',
      r.totalReads,
    ]);

    const updateRes = await fetch(`${base}/A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [HEADER_ROW, ...rows] }),
    });
    if (!updateRes.ok) {
      const body = await updateRes.text().catch(() => '');
      return { ok: false, error: `update respondió ${updateRes.status}: ${body.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

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
// yet) -- included because the user asked for a reading-activity column,
// but this is a one-time append, not a live sync, so the sheet won't
// reflect reading activity after the row is written. Revisit with a
// periodic re-sync if that staleness turns out to matter.
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

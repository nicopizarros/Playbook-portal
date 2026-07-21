// Client-upload handshake for the TipTap editor's image button/paste/drop.
// Two request types share this one route (see @vercel/blob/client's
// handleUpload): 'blob.generate-client-token' (the browser asking for a
// short-lived upload token) and 'blob.upload-completed' (Vercel's own
// server calling back once the bytes have actually landed in the store —
// this second call never reaches localhost, see HANDOFF.md).
//
// The editor role check happens here, in the route handler, BEFORE calling
// handleUpload — not only inside onBeforeGenerateToken. Verified directly
// (node_modules/@vercel/blob/dist/chunk-*.cjs's getTokenFromOptionsOrEnv):
// handleUpload resolves/validates BLOB_READ_WRITE_TOKEN unconditionally at
// its very top, before ever calling onBeforeGenerateToken — so an
// unconfigured token would short-circuit an auth check placed only inside
// that callback. Checking here first means "reject unauthenticated
// request" is verifiable independent of whether a real Blob token is
// configured in this environment.
import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { media } from '@/lib/db/schema';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const editorId = session.user.id;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ editorId }),
      }),
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayload ? (JSON.parse(tokenPayload) as { editorId?: string }) : {};
        await db.insert(media).values({ url: blob.url, uploadedBy: payload.editorId ?? null });
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

// ARCO self-service data export (see /privacidad's "Tus derechos" section)
// -- a signed-in reader downloading their own email + reading history as
// JSON. A Route Handler rather than a Server Action because this needs to
// set a real Content-Disposition download header, which a Server Action's
// return value can't do.
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getReaderAccountSummary } from '@/lib/data/reader-account';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'reader') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await getReaderAccountSummary(session.user.id);
  if (!summary) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const payload = {
    email: summary.email,
    memberSince: summary.memberSince.toISOString(),
    totalArticlesRead: summary.totalReads,
    articlesReadThisMonth: summary.readsThisMonth,
    recentReads: summary.recentReads.map(r => ({
      articleId: r.articleId,
      title: r.title,
      readAt: r.readAt.toISOString(),
    })),
    exportedAt: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="playbook-mis-datos.json"',
    },
  });
}

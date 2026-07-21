import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db/client';
import { siteContent } from '@/lib/db/schema';
import { getAllArticlesForAdmin } from '@/lib/data/articles';
import type { SiteContentData } from '@/lib/data/site-content';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminDashboardPage() {
  const session = await auth();
  const [contentRow] = await db.select().from(siteContent).where(eq(siteContent.id, 1)).limit(1);
  if (!contentRow) {
    throw new Error('site_content sin fila (id=1) — corre npm run migrate:json');
  }
  const articles = await getAllArticlesForAdmin();

  return (
    <AdminDashboard
      initialContent={contentRow.data as SiteContentData}
      initialContentVersion={contentRow.version}
      initialArticles={articles}
      editorUsername={session?.user?.name || ''}
    />
  );
}

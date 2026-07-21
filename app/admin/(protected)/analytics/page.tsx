import { getAnalyticsSnapshot } from '@/lib/analytics-data';
import { AnalyticsView } from '@/components/admin/analytics/AnalyticsView';

export default async function AdminAnalyticsPage() {
  const snapshot = await getAnalyticsSnapshot();
  return (
    <main className="admin-main analytics-main">
      <AnalyticsView initialSnapshot={snapshot} />
    </main>
  );
}

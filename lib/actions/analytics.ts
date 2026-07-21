'use server';

import { auth } from '@/auth';
import { getAnalyticsSnapshot, type AnalyticsSnapshot } from '@/lib/analytics-data';

export async function refreshAnalytics(): Promise<AnalyticsSnapshot> {
  const session = await auth();
  if (!session || session.user.role !== 'editor') {
    throw new Error('Unauthorized');
  }
  return getAnalyticsSnapshot();
}

'use client';

import { useState } from 'react';
import { TipTapEditor } from '@/components/admin/TipTapEditor';

// Temporary smoke-test harness for checkpoint 3 (TipTap + Blob upload) — the
// real dashboard (checkpoint 4) replaces this file entirely.
export function DashboardPlaceholder() {
  const [json, setJson] = useState<Record<string, unknown> | null>(null);

  return (
    <div>
      <TipTapEditor content={null} onChange={setJson} />
      <pre style={{ fontSize: 11, marginTop: 12, whiteSpace: 'pre-wrap' }}>
        {json ? JSON.stringify(json, null, 2) : '(sin cambios todavía)'}
      </pre>
    </div>
  );
}

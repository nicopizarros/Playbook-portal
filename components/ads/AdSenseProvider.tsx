'use client';

import { createContext, useContext } from 'react';
import type { AdSenseConfig } from '@/lib/adsense';

// Thin context so every AdSlot (six call sites across pages/components) can
// reach the server-read AdSense config without each call site having to
// thread clientId/adUnitId props down by hand. The provider itself is the
// only client boundary here -- app/(public)/layout.tsx (a Server Component)
// renders it once with server-read config as props, same pattern Next's App
// Router uses for any provider that needs server-only values.
const AdSenseContext = createContext<AdSenseConfig>({ clientId: null, slots: {} });

export function AdSenseProvider({ config, children }: { config: AdSenseConfig; children: React.ReactNode }) {
  return <AdSenseContext.Provider value={config}>{children}</AdSenseContext.Provider>;
}

export function useAdSenseConfig(): AdSenseConfig {
  return useContext(AdSenseContext);
}

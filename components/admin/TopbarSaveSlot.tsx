'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// AdminDashboard lives inside {children} of app/admin/(protected)/layout.tsx,
// a sibling of that layout's <header>, not a descendant — so it can't just
// render its save button/status/dirty-dot inline where legacy's topbar had
// them. This portals that UI into the '#admin-topbar-save-slot' div the
// layout renders for exactly this purpose.
export function TopbarSaveSlot({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById('admin-topbar-save-slot'));
  }, []);

  if (!slot) return null;
  return createPortal(children, slot);
}

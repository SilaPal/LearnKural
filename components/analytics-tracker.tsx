'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('_tk_vid');
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('_tk_vid', id);
    }
    return id;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef('');

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const payload = {
      page: pathname,
      visitorId,
      referrer: document.referrer || '',
    };

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

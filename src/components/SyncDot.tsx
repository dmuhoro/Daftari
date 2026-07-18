import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

type SyncState = 'synced' | 'pending' | 'error' | 'offline';

export default function SyncDot() {
  const { isOnline } = useOnlineStatus();
  const [state, setState] = useState<SyncState>('synced');

  useEffect(() => {
    if (!isOnline) {
      setState('offline');
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const count = await db.sync_queue.where('synced').equals(0).count();
        if (cancelled) return;
        setState(count > 0 ? 'pending' : 'synced');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isOnline]);

  const colorMap: Record<SyncState, string> = {
    synced: 'bg-green-500',
    pending: 'bg-amber-400',
    error: 'bg-red-500',
    offline: 'bg-stone-400',
  };

  const labelMap: Record<SyncState, string> = {
    synced: 'All data saved',
    pending: 'Syncing...',
    error: 'Sync error',
    offline: 'No internet',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorMap[state]}`}
      title={labelMap[state]}
      aria-label={labelMap[state]}
    />
  );
}

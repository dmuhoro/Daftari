import { useState, useEffect } from 'react';
import { countUnsyncedQueueItems } from '../lib/repository';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

type SyncState = 'synced' | 'pending' | 'error' | 'offline' | 'confirmed';

export default function SyncDot() {
  const { isOnline } = useOnlineStatus();
  const [state, setState] = useState<SyncState>('synced');
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOnline) {
      setState('offline');
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const result = await countUnsyncedQueueItems();
        const count = result.ok ? result.value : 0;
        if (cancelled) return;

        if (confirmedIds.size > 0) {
          setState('confirmed');
          const timer = setTimeout(() => {
            if (!cancelled) {
              setConfirmedIds(new Set());
              setState('synced');
            }
          }, 2000);
          return () => clearTimeout(timer);
        }

        setState(count > 0 ? 'pending' : 'synced');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isOnline, confirmedIds.size]);

  // Subscribe to realtime confirmations
  useEffect(() => {
    if (!isOnline) return;

    const channel = supabase
      .channel('sync-confirm')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daftari_transactions' },
        (payload: { new: Record<string, unknown> }) => {
          if (payload.new && payload.new.local_id) {
            setConfirmedIds(prev => new Set(prev).add(payload.new.local_id as string));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOnline]);

  if (state === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium" title="Synced to cloud" aria-label="Synced to cloud">
        <Check className="w-3 h-3" />
      </span>
    );
  }

  const colorMap: Record<SyncState, string> = {
    synced: 'bg-green-500',
    pending: 'bg-amber-400',
    error: 'bg-red-500',
    offline: 'bg-stone-400',
    confirmed: 'bg-green-500',
  };

  const labelMap: Record<SyncState, string> = {
    synced: 'All data saved',
    pending: 'Syncing...',
    error: 'Sync error',
    offline: 'No internet',
    confirmed: 'Synced to cloud',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorMap[state]}`}
      title={labelMap[state]}
      aria-label={labelMap[state]}
    />
  );
}

import { useState, useEffect, useRef } from 'react';
import { getPendingCount, getDeadLetterCount, getConflictCount } from '../features/sync/syncQueue';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CloudOff, Check, X } from 'lucide-react';

type SyncState = 'synced' | 'pending' | 'dead_letter' | 'offline';

export default function SyncDot() {
  const { t, language } = useTranslation();
  const { isOnline } = useOnlineStatus();
  const [state, setState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [deadLetterCount, setDeadLetterCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOnline) {
      setState('offline');
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const [pending, dead, conflicts] = await Promise.all([
          getPendingCount(),
          getDeadLetterCount(),
          getConflictCount(),
        ]);
        if (cancelled) return;

        setPendingCount(pending);
        setDeadLetterCount(dead);
        setConflictCount(conflicts);

        if (dead > 0) {
          setState('dead_letter');
        } else if (pending > 0) {
          setState('pending');
        } else {
          setState('synced');
        }
      } catch {
        if (!cancelled) setState('dead_letter');
      }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;

    const channel = supabase
      .channel('sync-confirm')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daftari_transactions' },
        () => {
          Promise.all([getPendingCount(), getDeadLetterCount(), getConflictCount()]).then(([pending, dead, conflicts]) => {
            if (dead > 0) {
              setState('dead_letter');
            } else if (pending > 0) {
              setState('pending');
            } else {
              setState('synced');
            }
            setPendingCount(pending);
            setDeadLetterCount(dead);
            setConflictCount(conflicts);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOnline]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        setShowDetails(false);
      }
    }
    if (showDetails) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showDetails]);

  if (!isOnline) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1"
          aria-label={t('sync_offline')}
        >
          <CloudOff className="w-3.5 h-3.5 text-stone-400" />
        </button>
        {showDetails && (
          <div ref={detailsRef} className="absolute top-full right-0 mt-2 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 p-3 min-w-48 z-50">
            <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
              {t('sync_offline')}
            </p>
          </div>
        )}
      </div>
    );
  }

  const badgeCount = deadLetterCount > 0 ? deadLetterCount : pendingCount;
  const showBadge = badgeCount > 0;

  const colorMap: Record<SyncState, string> = {
    synced: 'bg-green-500',
    pending: 'bg-amber-400',
    dead_letter: 'bg-red-500',
    offline: 'bg-stone-400',
  };

  const labelMap: Record<SyncState, string> = {
    synced: deadLetterCount > 0 ? t('sync_failed') : t('sync_healthy'),
    pending: t('sync_pending'),
    dead_letter: t('sync_failed'),
    offline: t('sync_offline'),
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 relative"
        aria-label={labelMap[state]}
      >
        <span className={`inline-block w-2 h-2 rounded-full ${colorMap[state]}`} />
        {showBadge && (
          <span className={`absolute -top-1.5 -right-2.5 text-[10px] font-bold text-white px-1 rounded-full min-w-[14px] text-center leading-4 ${
            deadLetterCount > 0 ? 'bg-red-500' : 'bg-amber-400'
          }`}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {showDetails && (
        <div ref={detailsRef} className="absolute top-full right-0 mt-2 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 p-3 min-w-56 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-200 uppercase tracking-wide">
              {t('sync_status')}
            </span>
            <button onClick={() => setShowDetails(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                {t('pending_sync')}
              </span>
              <span className={`font-semibold ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                {pendingCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                {t('sync_failed')}
              </span>
              <span className={`font-semibold ${deadLetterCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {deadLetterCount}
              </span>
            </div>
            {conflictCount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400">
                  {language === 'sw' ? 'Migongano' : 'Conflicts'}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {conflictCount}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400">
                {t('sync_online')}
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {language === 'sw' ? 'Ndiyo' : 'Yes'}
              </span>
            </div>
          </div>
          {deadLetterCount > 0 && (
            <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-red-600 dark:text-red-400 leading-tight">
                  {t('sync_dead_letter_tip')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { flushQueue, registerBackgroundSync } from '../features/sync/syncQueue';
import { syncAllTables } from '../lib/syncAll';

export function useSync() {
  const { isOnline } = useOnlineStatus();
  const wasOffline = useRef(!isOnline);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (isOnline) {
        flushQueue().catch(console.error);
        syncAllTables().catch(console.error);
      }
      return;
    }

    if (wasOffline.current && isOnline) {
      flushQueue().catch(console.error);
      syncAllTables().catch(console.error);
      registerBackgroundSync().catch(console.error);
    }

    wasOffline.current = !isOnline;
  }, [isOnline]);

  return { isOnline };
}

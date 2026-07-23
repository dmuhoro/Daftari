import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { flushQueue, registerBackgroundSync } from '../features/sync/syncQueue';
import { captureError } from '../lib/sentry';

export function useSync() {
  const { isOnline } = useOnlineStatus();
  const wasOffline = useRef(!isOnline);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (isOnline) {
        flushQueue().catch((e) => captureError(e, { feature: 'sync', action: 'flush_on_mount' }));
      }
      return;
    }

    if (wasOffline.current && isOnline) {
      flushQueue().catch((e) => captureError(e, { feature: 'sync', action: 'flush_on_reconnect' }));
      registerBackgroundSync().catch((e) => captureError(e, { feature: 'sync', action: 'register_bg_sync' }));
    }

    wasOffline.current = !isOnline;
  }, [isOnline]);

  return { isOnline };
}

import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { flushQueue } from '../features/sync/syncQueue';

export function useSync() {
  const { isOnline } = useOnlineStatus();
  const wasOffline = useRef(!isOnline);
  const hasMounted = useRef(false);

  useEffect(() => {
    // Run flush on mount if online
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (isOnline) {
        flushQueue().catch(console.error);
      }
      return;
    }

    // Run flush when transitioning from offline to online
    if (wasOffline.current && isOnline) {
      flushQueue().catch(console.error);
    }

    wasOffline.current = !isOnline;
  }, [isOnline]);

  return { isOnline };
}

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOnlineStatus } from './useOnlineStatus';
import { applyRealtimeChange, type RealtimeTable } from '../lib/realtimeApply';
import { captureError } from '../lib/sentry';

/**
 * True multi-device live sync.
 *
 * Subscribes to postgres_changes on the user's OWN rows (realtime applies RLS,
 * so the server only streams rows the session may SELECT; we additionally
 * filter by user_id on the client as a second line of defense). Each change is
 * applied via applyRealtimeChange (upsert/delete to Dexie + tenant reload) so
 * the open dashboard/list updates WITHOUT a manual pull or reload.
 *
 * Guardrails: only runs online; foreign-row deltas are ignored; failures are
 * captured to error tracking, never thrown into the render path.
 */
export function useRealtimeSync(enabled: boolean) {
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    if (!enabled || !isOnline) return;

    let cancelled = false;
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      userId = user.id;

      const tables: RealtimeTable[] = ['daftari_transactions', 'daftari_businesses'];

      channel = supabase
        .channel('realtime-live');

      for (const table of tables) {
        for (const event of ['INSERT', 'UPDATE', 'DELETE'] as const) {
          channel.on(
            'postgres_changes',
            { event, schema: 'public', table, filter: `user_id=eq.${userId}` },
            (payload) => {
              void applyRealtimeChange(table, {
                eventType: payload.eventType,
                new: payload.new ?? null,
                old: payload.old ?? null,
              }, userId!);
            }
          );
        }
      }

      channel.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' && err) {
          captureError(err, { feature: 'realtime', action: 'subscribe' });
        }
      });
    }

    start();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [enabled, isOnline]);
}
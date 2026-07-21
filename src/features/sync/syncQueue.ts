import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { captureError } from '../../lib/sentry';

const MAX_BATCH = 50
const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_RESET_MS = 60_000
const MAX_RETRIES = 5
const DEAD_LETTER_SYNCED = 2

const BACKOFF_BASE_MS = 2_000

let consecutiveFailures = 0
let circuitBrokenAt: number | null = null
let lastError: string | null = null

export type QueuePayload = Record<string, unknown>

function getRetries(payload: string): number {
  try {
    const data = JSON.parse(payload) as Record<string, unknown>
    return typeof data._retries === 'number' ? data._retries : 0
  } catch {
    return 0
  }
}

function incrementRetries(payload: string): string {
  try {
    const data = JSON.parse(payload) as Record<string, unknown>
    data._retries = ((data._retries as number) || 0) + 1
    return JSON.stringify(data)
  } catch {
    return payload
  }
}

export async function addToQueue(
  operation: 'upsert' | 'delete',
  tableName: string,
  recordId: string,
  payload: QueuePayload | null
) {
  await db.sync_queue.add({
    operation,
    table_name: tableName,
    record_id: recordId,
    payload: payload ? JSON.stringify({ ...payload, _retries: 0 }) : '',
    synced: 0,
    created_at: new Date().toISOString(),
  });
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const now = Date.now()

  if (circuitBrokenAt !== null) {
    if (now - circuitBrokenAt < CIRCUIT_BREAKER_RESET_MS) {
      return { synced: 0, failed: 0 };
    }
    circuitBrokenAt = null
    consecutiveFailures = 0
    lastError = null
  }

  const unsynced = await db.sync_queue.where('synced').equals(0).toArray();

  if (unsynced.length === 0) {
    return { synced: 0, failed: 0 };
  }

  if (unsynced.length > MAX_BATCH) {
    lastError = `Queue overflow: ${unsynced.length} items (max ${MAX_BATCH})`
    circuitBrokenAt = now
    consecutiveFailures = CIRCUIT_BREAKER_THRESHOLD
    captureError(new Error(lastError), { feature: 'sync', action: 'flushQueue_overflow' })
    return { synced: 0, failed: unsynced.length };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of unsynced) {
    // Exponential backoff: skip items not yet ready for retry
    // Items at MAX_RETRIES are always processed (moved to dead-letter on failure)
    const retries = item.payload ? getRetries(item.payload) : 0
    if (retries > 0 && retries < MAX_RETRIES) {
      const created = new Date(item.created_at).getTime()
      const backoffMs = BACKOFF_BASE_MS * Math.pow(2, retries - 1)
      if (now - created < backoffMs) {
        continue
      }
    }

    try {
      const tableName = item.table_name || 'daftari_transactions'

      if (item.operation === 'upsert' && item.payload) {
        const { _retries: _ignore, ...data } = JSON.parse(item.payload) as QueuePayload & { _retries?: number };
        void _ignore;
        const { error } = await supabase
          .from(tableName)
          .upsert(data, { onConflict: 'local_id' });

        if (error) throw error;
      } else if (item.operation === 'delete') {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('local_id', item.record_id);

        if (error) throw error;
      }

      await db.sync_queue.delete(item.id!);
      syncedCount++;
    } catch (cause) {
      failedCount++;
      consecutiveFailures++
      lastError = cause instanceof Error ? cause.message : String(cause)

      // Exponential backoff: increment retry counter in payload
      if (item.payload) {
        const newPayload = incrementRetries(item.payload)
        const newRetries = getRetries(newPayload)
        if (newRetries >= MAX_RETRIES) {
          await db.sync_queue.update(item.id!, {
            synced: DEAD_LETTER_SYNCED,
            payload: newPayload,
          })
          captureError(cause instanceof Error ? cause : new Error(String(cause)), {
            feature: 'sync',
            action: 'dead_letter',
          })
        } else {
          await db.sync_queue.update(item.id!, { payload: newPayload })
        }
      }

      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        circuitBrokenAt = Date.now()
        captureError(cause instanceof Error ? cause : new Error(String(cause)), { feature: 'sync', action: 'circuit_breaker_opened' })
        break
      }
    }
  }

  return { synced: syncedCount, failed: failedCount };
}

export function getPendingCount() {
  return db.sync_queue.where('synced').equals(0).count();
}

export function getDeadLetterCount() {
  return db.sync_queue.where('synced').equals(DEAD_LETTER_SYNCED).count();
}

export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-transactions');
    } catch (cause) { captureError(cause, { feature: 'sync', action: 'registerBackgroundSync' }) }
  }
}

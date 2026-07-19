import { db, type Transaction } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { captureError } from '../../lib/sentry';

const MAX_BATCH = 50
const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_RESET_MS = 60_000

let consecutiveFailures = 0
let circuitBrokenAt: number | null = null
let lastError: string | null = null

export interface QueuePayload {
  local_id: string;
  type: Transaction['type'];
  category: string;
  source: string;
  amount: number;
  description?: string;
  recorded_at: string;
  synced: number;
  user_id?: string;
  mpesa_code?: string;
  mpesa_sender?: string;
  payment_method?: string;
  receipt_id?: string;
  business_id?: string;
  product_id?: string;
  cost_price?: number;
  updated_at?: string;
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
    payload: payload ? JSON.stringify(payload) : '',
    synced: 0,
    created_at: new Date().toISOString(),
  });
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const now = Date.now()

  // Circuit breaker: if too many consecutive failures, block for 60s
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

  // Back-pressure: reject if queue exceeds max batch
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
    try {
      if (item.operation === 'upsert' && item.payload) {
        const data = JSON.parse(item.payload) as QueuePayload;
        const { error } = await supabase
          .from('daftari_transactions')
          .upsert(data, { onConflict: 'local_id' });

        if (error) throw error;

        await db.transactions.where('local_id').equals(item.record_id).modify({ synced: 1 });
      } else if (item.operation === 'delete') {
        const { error } = await supabase
          .from('daftari_transactions')
          .delete()
          .eq('local_id', item.record_id);

        if (error) throw error;
      }

      await db.sync_queue.update(item.id!, { synced: 1 });
      syncedCount++;
    } catch (cause) {
      failedCount++;
      consecutiveFailures++
      lastError = cause instanceof Error ? cause.message : String(cause)

      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        circuitBrokenAt = Date.now()
        captureError(cause instanceof Error ? cause : new Error(String(cause)), { feature: 'sync', action: 'circuit_breaker_opened' })
        break
      }
    }
  }

  return { synced: syncedCount, failed: failedCount };
}

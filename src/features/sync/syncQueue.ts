import { db, type Transaction } from '../../lib/db';
import { supabase } from '../../lib/supabase';

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
  const unsynced = await db.sync_queue.where('synced').equals(0).toArray();

  if (unsynced.length === 0) {
    return { synced: 0, failed: 0 };
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
    } catch {
      failedCount++;
    }
  }

  return { synced: syncedCount, failed: failedCount };
}

import { db } from './db';

export async function exportAllData(): Promise<void> {
  const tables = ['transactions', 'business', 'customers', 'daily_closes', 'suppliers', 'purchase_orders', 'stock_adjustments', 'sync_queue'] as const;
  const data: Record<string, unknown> = {};
  for (const table of tables) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data[table] = await (db as any)[table].toArray();
    } catch { data[table] = []; }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daftari-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

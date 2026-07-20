import { db, type TableName } from './db';

export async function exportAllData(): Promise<void> {
  const tables: TableName[] = ['transactions', 'business', 'customers', 'daily_closes', 'suppliers', 'purchase_orders', 'stock_adjustments', 'sync_queue'];
  const data: Record<string, unknown> = {};
  for (const table of tables) {
    try {
      data[table] = await db.table(table).toArray();
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

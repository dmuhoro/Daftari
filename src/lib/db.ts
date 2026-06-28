import Dexie, { Table } from 'dexie';

export type TransactionType = 'income' | 'expense' | 'withdrawal' | 'debt_taken' | 'debt_repaid';

export interface Transaction {
  id?: number;
  local_id: string;
  type: TransactionType;
  category: string;
  source: string;
  amount: number;
  description?: string;
  recorded_at: string;
  synced: number; // 0 | 1
  user_id?: string;
  mpesa_code?: string;
  mpesa_sender?: string;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'upsert' | 'delete';
  table_name: string;
  record_id: string;
  payload: string;
  synced: number;
  created_at: string;
}

export interface Business {
  id?: number;
  name: string;
  owner_name?: string;
  currency: string;
  user_id?: string;
  created_at: string;
}

export interface DailyClose {
  id?: number;
  date: string;
  profit: number;
  revenue: number;
  expenses: number;
  created_at: string;
}

class DaftariDB extends Dexie {
  transactions!: Table<Transaction>;
  sync_queue!: Table<SyncQueueItem>;
  business!: Table<Business>;
  daily_closes!: Table<DailyClose>;

  constructor() {
    super('DaftariDB');
    this.version(2).stores({
      transactions: '++id, &local_id, type, category, source, recorded_at, synced',
      sync_queue: '++id, operation, synced, created_at',
      business: '++id',
      daily_closes: '++id, &date',
    });
  }
}

export const db = new DaftariDB();

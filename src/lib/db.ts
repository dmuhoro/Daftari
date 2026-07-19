// eslint-disable-next-line no-restricted-imports
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
  payment_method?: string;
  receipt_id?: string;
  business_id?: string;
  product_id?: string;
  cost_price?: number;
  updated_at?: string;
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
  local_id?: string;
  name: string;
  owner_name?: string;
  currency: string;
  user_id?: string;
  created_at: string;
  category?: string;
  subcategory?: string;
  payment_methods?: string;
  products?: string;
  updated_at?: string;
}

export interface DailyClose {
  id?: number;
  local_id?: string;
  date: string;
  business_id?: string;
  profit: number;
  revenue: number;
  expenses: number;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id?: number;
  local_id?: string;
  name: string;
  phone?: string;
  business_id?: string;
  total_visits: number;
  total_spent: number;
  last_visit: string;
  created_at: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id?: number;
  local_id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

class DaftariDB extends Dexie {
  transactions!: Table<Transaction>;
  sync_queue!: Table<SyncQueueItem>;
  business!: Table<Business>;
  daily_closes!: Table<DailyClose>;
  customers!: Table<Customer>;
  purchase_orders!: Table<PurchaseOrder>;

  constructor() {
    super('DaftariDB');
    this.version(5).stores({
      transactions: '++id, &local_id, type, category, source, recorded_at, synced, business_id, product_id',
      sync_queue: '++id, operation, synced, created_at',
      business: '++id, &local_id',
      daily_closes: '++id, &date, business_id',
      customers: '++id, &name, phone, business_id',
      purchase_orders: '++id, &local_id, business_id, product_id, created_at',
    }).upgrade(async (tx) => {
      const now = new Date().toISOString();
      await tx.table('transactions').toCollection().modify((t) => {
        t.business_id = t.business_id || undefined;
        t.product_id = t.product_id || undefined;
        t.cost_price = t.cost_price || undefined;
        t.updated_at = t.updated_at || now;
      });
      await tx.table('business').toCollection().modify((b) => {
        b.local_id = b.local_id || b.user_id || crypto.randomUUID();
        b.updated_at = b.updated_at || now;
      });
      await tx.table('daily_closes').toCollection().modify((d) => {
        d.local_id = d.local_id || crypto.randomUUID();
        d.business_id = d.business_id || undefined;
        d.updated_at = d.updated_at || now;
      });
      await tx.table('customers').toCollection().modify((c) => {
        c.local_id = c.local_id || crypto.randomUUID();
        c.business_id = c.business_id || undefined;
        c.updated_at = c.updated_at || now;
      });
    });
  }
}

export const db = new DaftariDB();

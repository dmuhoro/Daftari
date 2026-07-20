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
  referral_code?: string;
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
  loyalty_points?: number;
}

export interface Supplier {
  id?: number;
  local_id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface StockAdjustment {
  id?: number;
  local_id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  quantity_change: number;
  reason: 'restock' | 'wastage' | 'spoilage' | 'damage' | 'theft' | 'count_correction' | 'return' | 'other';
  reason_text?: string;
  notes?: string;
  created_at: string;
  synced: number;
}

export interface PurchaseOrder {
  id?: number;
  local_id: string;
  business_id: string;
  supplier_id?: string;
  supplier_name?: string;
  status: 'draft' | 'pending' | 'partial' | 'received' | 'cancelled';
  items: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  synced: number;
}

export interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
}

class DaftariDB extends Dexie {
  transactions!: Table<Transaction>;
  sync_queue!: Table<SyncQueueItem>;
  business!: Table<Business>;
  daily_closes!: Table<DailyClose>;
  customers!: Table<Customer>;
  purchase_orders!: Table<PurchaseOrder>;
  suppliers!: Table<Supplier>;
  stock_adjustments!: Table<StockAdjustment>;

  constructor() {
    super('DaftariDB');
    this.version(6).stores({
      transactions: '++id, &local_id, type, category, source, recorded_at, synced, business_id, product_id',
      sync_queue: '++id, operation, synced, created_at',
      business: '++id, &local_id',
      daily_closes: '++id, &date, business_id',
      customers: '++id, &name, phone, business_id',
      purchase_orders: '++id, &local_id, business_id, supplier_id, status, created_at',
      suppliers: '++id, &local_id, business_id, name',
      stock_adjustments: '++id, &local_id, business_id, product_id, created_at, reason',
    }).upgrade(async (tx) => {
      // Migrate purchase_orders from v5 (single product) to v6 (multi-item JSON)
      await tx.table('purchase_orders').toCollection().modify((po: Record<string, unknown>) => {
        if (typeof po.items === 'string') return;
        po.items = JSON.stringify([{
          product_id: po.product_id || '',
          product_name: po.product_name || '',
          quantity: po.quantity || 0,
          quantity_received: po.synced === 1 ? (po.quantity || 0) : 0,
          unit_cost: po.unit_cost || 0,
          total_cost: po.total_cost || 0,
        }]);
        po.status = po.status || (po.synced === 1 ? 'received' : 'pending');
        po.supplier_id = po.supplier_id || undefined;
        po.supplier_name = po.supplier_name || undefined;
        delete po.product_id;
        delete po.product_name;
        delete po.quantity;
        delete po.unit_cost;
      });
    });
  }
}

export const db = new DaftariDB();

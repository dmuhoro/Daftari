import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, Transaction, type TransactionType } from './db';
import { supabase } from './supabase';
import { addToQueue, type QueuePayload } from '../features/sync/syncQueue';
import type { Theme } from './types';
import { generateReceiptId } from './receiptId';

interface Business {
  id: string;
  local_id?: string;
  name: string;
  owner_name?: string;
  currency: string;
  category?: string;
  subcategory?: string;
  payment_methods?: string[];
  products?: Array<{ id: string; name: string; price: number; cost_price?: number; unit?: string; stock?: number; low_stock_threshold?: number }>;
}

interface AppStore {
  language: 'sw' | 'en';
  business: Business | null;
  businesses: Business[];
  activeBusinessId: string | null;
  transactions: Transaction[];
  lastCloseDate: string | null;
  closePromptDismissedAt: number | null;
  theme: Theme;
  setLanguage: (language: 'sw' | 'en') => void;
  setBusiness: (business: Business | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  addBusiness: (business: Business) => void;
  setActiveBusinessId: (id: string | null) => void;
  updateBusiness: (partial: Partial<Business>) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<string | undefined>;
  updateTransaction: (local_id: string, updates: Partial<Omit<Transaction, 'id' | 'local_id'>>) => Promise<void>;
  deleteTransaction: (local_id: string) => Promise<void>;
  setLastCloseDate: (date: string) => void;
  dismissClosePrompt: () => void;
  setTheme: (theme: Theme) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      language: 'sw',
      business: null,
      businesses: [],
      activeBusinessId: null,
      transactions: [],
      lastCloseDate: null,
      closePromptDismissedAt: null,
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setBusiness: (business) => set({ business }),
      setBusinesses: (businesses) => set({ businesses }),
      addBusiness: (business) => set((state) => ({
        businesses: [...state.businesses.filter(b => b.id !== business.id), business],
      })),
      setActiveBusinessId: (id) => set({ activeBusinessId: id }),
      updateBusiness: (partial) => set((state) => ({
        business: state.business ? { ...state.business, ...partial } : null,
        businesses: state.businesses.map((b) =>
          b.id === (state.business?.id ?? '') ? { ...b, ...partial } : b
        ),
      })),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: async (tx) => {
        const state = get();
        const { data: { user } } = await supabase.auth.getUser();
        const receipt_id = tx.type === 'income' ? generateReceiptId() : undefined;
        const txWithUser = {
          ...tx,
          user_id: user?.id,
          receipt_id,
          business_id: tx.business_id || state.activeBusinessId || undefined,
          updated_at: new Date().toISOString(),
        };

        await db.transactions.add(txWithUser);

        const queuePayload: QueuePayload = {
          local_id: txWithUser.local_id,
          type: txWithUser.type as TransactionType,
          category: txWithUser.category,
          source: txWithUser.source,
          amount: txWithUser.amount,
          description: txWithUser.description,
          recorded_at: txWithUser.recorded_at,
          synced: 0,
          user_id: txWithUser.user_id,
          mpesa_code: txWithUser.mpesa_code,
          mpesa_sender: txWithUser.mpesa_sender,
          payment_method: txWithUser.payment_method,
          receipt_id: txWithUser.receipt_id,
          business_id: txWithUser.business_id,
          product_id: txWithUser.product_id,
          cost_price: txWithUser.cost_price,
        };
        await addToQueue('upsert', 'daftari_transactions', txWithUser.local_id, queuePayload);

        set((state) => ({ transactions: [txWithUser, ...state.transactions] }));
        return receipt_id;
      },
      updateTransaction: async (local_id, updates) => {
        const now = new Date().toISOString();
        const fullUpdates = { ...updates, updated_at: now };
        await db.transactions.where('local_id').equals(local_id).modify(fullUpdates);
        const { data: { user } } = await supabase.auth.getUser();
        const existing = get().transactions.find(t => t.local_id === local_id);
        const queuePayload: QueuePayload = {
          local_id,
          type: (updates.type ?? existing?.type ?? 'income') as TransactionType,
          category: updates.category ?? existing?.category ?? '',
          source: updates.source ?? existing?.source ?? 'manual',
          amount: updates.amount ?? existing?.amount ?? 0,
          description: updates.description ?? existing?.description,
          recorded_at: updates.recorded_at ?? existing?.recorded_at ?? new Date().toISOString(),
          synced: 0,
          user_id: user?.id,
          payment_method: updates.payment_method ?? existing?.payment_method,
          business_id: existing?.business_id,
          product_id: existing?.product_id,
          cost_price: existing?.cost_price,
        };
        await addToQueue('upsert', 'daftari_transactions', local_id, queuePayload);
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.local_id === local_id ? { ...tx, ...fullUpdates } : tx
          ),
        }));
      },
      deleteTransaction: async (local_id) => {
        await db.transactions.where('local_id').equals(local_id).delete();
        await addToQueue('delete', 'daftari_transactions', local_id, null);
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.local_id !== local_id),
        }));
      },
      setLastCloseDate: (date) => set({ lastCloseDate: date, closePromptDismissedAt: null }),
      dismissClosePrompt: () => set({ closePromptDismissedAt: Date.now() }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'daftari-store',
      partialize: (state) => ({
        language: state.language,
        business: state.business,
        businesses: state.businesses,
        activeBusinessId: state.activeBusinessId,
        lastCloseDate: state.lastCloseDate,
        closePromptDismissedAt: state.closePromptDismissedAt,
        theme: state.theme,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, Transaction, type TransactionType } from './db';
import { supabase } from './supabase';
import { addToQueue, type QueuePayload } from '../features/sync/syncQueue';
import type { Theme } from './types';
import { generateReceiptId } from './receiptId';

interface Business {
  id: string;
  name: string;
  owner_name?: string;
  currency: string;
  category?: string;
  subcategory?: string;
  payment_methods?: string[];
  products?: Array<{ id: string; name: string; price: number; unit?: string; stock?: number; low_stock_threshold?: number }>;
}

interface AppStore {
  language: 'sw' | 'en';
  business: Business | null;
  transactions: Transaction[];
  lastCloseDate: string | null;
  closePromptDismissedAt: number | null;
  theme: Theme;
  setLanguage: (language: 'sw' | 'en') => void;
  setBusiness: (business: Business | null) => void;
  updateBusiness: (partial: Partial<Business>) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<string | undefined>;
  setLastCloseDate: (date: string) => void;
  dismissClosePrompt: () => void;
  setTheme: (theme: Theme) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      language: 'sw',
      business: null,
      transactions: [],
      lastCloseDate: null,
      closePromptDismissedAt: null,
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setBusiness: (business) => set({ business }),
      updateBusiness: (partial) => set((state) => ({
        business: state.business ? { ...state.business, ...partial } : null,
      })),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: async (tx) => {
        const { data: { user } } = await supabase.auth.getUser();
        const receipt_id = tx.type === 'income' ? generateReceiptId() : undefined;
        const txWithUser = { ...tx, user_id: user?.id, receipt_id };

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
        };
        await addToQueue('upsert', 'daftari_transactions', txWithUser.local_id, queuePayload);

        set((state) => ({ transactions: [txWithUser, ...state.transactions] }));
        return receipt_id;
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
        lastCloseDate: state.lastCloseDate,
        closePromptDismissedAt: state.closePromptDismissedAt,
        theme: state.theme,
      }),
    }
  )
);
